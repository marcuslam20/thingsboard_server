import api from './client';
import { PageData, PageLink, pageLinkToQueryParams } from '@/models/page.model';

export interface NotificationTemplate {
  id: { id: string; entityType: string };
  createdTime: number;
  tenantId: { id: string; entityType: string };
  name: string;
  notificationType: string;
  configuration: {
    deliveryMethodsTemplates: Record<string, { enabled: boolean; subject?: string; body: string }>;
  };
}

export interface NotificationRule {
  id: { id: string; entityType: string };
  createdTime: number;
  tenantId: { id: string; entityType: string };
  name: string;
  enabled: boolean;
  templateId: { id: string; entityType: string };
  triggerType: string;
  triggerConfig: Record<string, unknown>;
  recipientsConfig: Record<string, unknown>;
  additionalConfig?: Record<string, unknown>;
}

export interface Notification {
  id: { id: string; entityType: string };
  createdTime: number;
  requestId: { id: string; entityType: string };
  recipientId: { id: string; entityType: string };
  type: string;
  subject?: string;
  text: string;
  info?: Record<string, unknown>;
  status: string;
}

export const notificationApi = {
  getNotificationTemplates(pl: PageLink): Promise<PageData<NotificationTemplate>> {
    return api.get('/api/notification/templates', { params: pageLinkToQueryParams(pl) }).then((r) => r.data);
  },

  getNotificationTemplate(templateId: string): Promise<NotificationTemplate> {
    return api.get(`/api/notification/template/${templateId}`).then((r) => r.data);
  },

  saveNotificationTemplate(template: Partial<NotificationTemplate>): Promise<NotificationTemplate> {
    return api.post('/api/notification/template', template).then((r) => r.data);
  },

  deleteNotificationTemplate(templateId: string): Promise<void> {
    return api.delete(`/api/notification/template/${templateId}`).then(() => undefined);
  },

  getNotificationRules(pl: PageLink): Promise<PageData<NotificationRule>> {
    return api.get('/api/notification/rules', { params: pageLinkToQueryParams(pl) }).then((r) => r.data);
  },

  getNotificationRule(ruleId: string): Promise<NotificationRule> {
    return api.get(`/api/notification/rule/${ruleId}`).then((r) => r.data);
  },

  saveNotificationRule(rule: Partial<NotificationRule>): Promise<NotificationRule> {
    return api.post('/api/notification/rule', rule).then((r) => r.data);
  },

  deleteNotificationRule(ruleId: string): Promise<void> {
    return api.delete(`/api/notification/rule/${ruleId}`).then(() => undefined);
  },

  getNotifications(pl: PageLink, unreadOnly?: boolean): Promise<PageData<Notification>> {
    const params: Record<string, string> = pageLinkToQueryParams(pl);
    if (unreadOnly) params.unreadOnly = 'true';
    return api.get('/api/notifications', { params }).then((r) => r.data);
  },

  markNotificationAsRead(notificationId: string): Promise<void> {
    return api.put(`/api/notification/${notificationId}/read`).then(() => undefined);
  },

  markAllNotificationsAsRead(): Promise<void> {
    return api.put('/api/notifications/read').then(() => undefined);
  },

  deleteNotification(notificationId: string): Promise<void> {
    return api.delete(`/api/notification/${notificationId}`).then(() => undefined);
  },
};
