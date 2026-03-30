/**
 * Copyright © 2016-2025 The Thingsboard Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
package org.thingsboard.server.service.scene.schedule;

import com.fasterxml.jackson.databind.JsonNode;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.thingsboard.server.queue.util.TbSceneEngineComponent;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;

/**
 * Parse SCHEDULE condition → calculate next trigger time.
 *
 * Schedule condition format (Tuya-compatible):
 * {
 *   "conditionType": "SCHEDULE",
 *   "timeZoneId": "Asia/Ho_Chi_Minh",
 *   "loops": "0111110",              ← [MON][TUE][WED][THU][FRI][SAT][SUN]
 *   "time": "18:00",                 ← HH:mm
 *   "date": "20260320"               ← only when loops = "0000000" (one-time)
 * }
 *
 * loops examples:
 *   "1111111" = every day
 *   "0111110" = Mon-Fri (weekdays)
 *   "0000011" = Sat-Sun (weekends)
 *   "0000000" = one-time (uses "date")
 */
@Slf4j
@Component
@TbSceneEngineComponent
public class ScheduleCalculator {

    private static final DateTimeFormatter TIME_FORMAT = DateTimeFormatter.ofPattern("H:mm");
    private static final DateTimeFormatter DATE_FORMAT = DateTimeFormatter.ofPattern("yyyyMMdd");

    /**
     * Calculate next trigger time from a SCHEDULE condition.
     *
     * @param scheduleCondition JSON node with loops, time, timeZoneId, date
     * @return epoch milliseconds of next trigger, or -1 if no future trigger
     */
    public long calculateNextTriggerTime(JsonNode scheduleCondition) {
        String loops = scheduleCondition.get("loops").asText();
        String time = scheduleCondition.get("time").asText();
        String timeZoneId = scheduleCondition.has("timeZoneId")
                ? scheduleCondition.get("timeZoneId").asText()
                : "Asia/Ho_Chi_Minh";

        ZoneId zone = ZoneId.of(timeZoneId);
        LocalTime triggerTime = LocalTime.parse(time, TIME_FORMAT);
        ZonedDateTime now = ZonedDateTime.now(zone);

        if ("0000000".equals(loops)) {
            return calculateOneTime(scheduleCondition, triggerTime, zone, now);
        } else {
            return calculateRecurring(loops, triggerTime, zone, now);
        }
    }

    /**
     * One-time: trigger at specific date+time, then never again.
     *
     * Example: date="20260401", time="08:00"
     *   → If now < 2026-04-01 08:00 → return that timestamp
     *   → If now > 2026-04-01 08:00 → return -1 (expired)
     */
    private long calculateOneTime(JsonNode condition, LocalTime triggerTime,
                                   ZoneId zone, ZonedDateTime now) {
        if (!condition.has("date")) {
            log.warn("One-time schedule missing 'date' field");
            return -1;
        }
        String dateStr = condition.get("date").asText();
        LocalDate date = LocalDate.parse(dateStr, DATE_FORMAT);
        ZonedDateTime triggerDateTime = ZonedDateTime.of(date, triggerTime, zone);

        if (triggerDateTime.isAfter(now)) {
            return triggerDateTime.toInstant().toEpochMilli();
        }
        return -1; // already passed
    }

    /**
     * Recurring: find next matching day of week from loops pattern.
     *
     * Algorithm: check today, then tomorrow, ... up to 6 days ahead.
     *
     * Example: loops="0111110", time="18:00", now=Wednesday 19:00
     *   → Wed: loops[2]='1' but 19:00 > 18:00 → skip (already passed today)
     *   → Thu: loops[3]='1' and 18:00 is in future → MATCH
     *   → Return Thursday 18:00
     */
    private long calculateRecurring(String loops, LocalTime triggerTime,
                                     ZoneId zone, ZonedDateTime now) {
        LocalDate today = now.toLocalDate();

        for (int offset = 0; offset < 7; offset++) {
            LocalDate candidateDate = today.plusDays(offset);
            int loopsIndex = candidateDate.getDayOfWeek().getValue() - 1;
            // DayOfWeek: MONDAY=1→index 0, SUNDAY=7→index 6

            if (loops.charAt(loopsIndex) == '1') {
                ZonedDateTime candidate = ZonedDateTime.of(candidateDate, triggerTime, zone);
                if (candidate.isAfter(now)) {
                    return candidate.toInstant().toEpochMilli();
                }
            }
        }

        log.warn("No matching day in loops: {}", loops);
        return -1;
    }
}
