import { useRef } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Popper from '@mui/material/Popper';
import ClickAwayListener from '@mui/material/ClickAwayListener';
import LanguageIcon from '@mui/icons-material/Language';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import CheckIcon from '@mui/icons-material/Check';
import { useTranslation } from 'react-i18next';
import { useState } from 'react';

const languages = [
  { code: 'en', label: 'English' },
  { code: 'vi', label: 'Tiếng Việt' },
  { code: 'zh', label: '简体中文' },
];

export default function LanguageSwitcher({ color = '#999' }: { color?: string }) {
  const { i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const anchorRef = useRef<HTMLDivElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const currentLang = languages.find(l => l.code === i18n.language) || languages[0];

  const handleChange = (code: string) => {
    i18n.changeLanguage(code);
    localStorage.setItem('language', code);
    setOpen(false);
  };

  const handleEnter = () => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
    setOpen(true);
  };

  const handleLeave = () => {
    closeTimer.current = setTimeout(() => setOpen(false), 150);
  };

  return (
    <ClickAwayListener onClickAway={() => setOpen(false)}>
      <Box
        ref={anchorRef}
        onMouseEnter={handleEnter}
        onMouseLeave={handleLeave}
        sx={{ position: 'relative', display: 'inline-flex' }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 0.5,
            cursor: 'pointer',
            py: 0.5,
            px: 0.75,
            borderRadius: 1,
            '&:hover': { bgcolor: 'rgba(0,0,0,0.04)' },
          }}
        >
          <LanguageIcon sx={{ fontSize: 16, color }} />
          <Typography sx={{ fontSize: 13, color, userSelect: 'none' }}>
            {currentLang.label}
          </Typography>
          <KeyboardArrowDownIcon
            sx={{
              fontSize: 16,
              color,
              transition: 'transform 200ms',
              transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
            }}
          />
        </Box>

        <Popper
          open={open}
          anchorEl={anchorRef.current}
          placement="bottom-start"
          sx={{ zIndex: 1400 }}
          modifiers={[{ name: 'offset', options: { offset: [0, 4] } }]}
        >
          <Paper
            onMouseEnter={handleEnter}
            onMouseLeave={handleLeave}
            elevation={3}
            sx={{
              minWidth: 140,
              py: 0.5,
              borderRadius: 1.5,
              border: '1px solid #eee',
            }}
          >
            {languages.map((lang) => {
              const isSelected = lang.code === i18n.language;
              return (
                <Box
                  key={lang.code}
                  onClick={() => handleChange(lang.code)}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    px: 1.5,
                    py: 0.75,
                    cursor: 'pointer',
                    fontSize: 13,
                    color: isSelected ? '#FF6A00' : '#333',
                    fontWeight: isSelected ? 600 : 400,
                    bgcolor: isSelected ? '#FFF7F0' : 'transparent',
                    '&:hover': {
                      bgcolor: isSelected ? '#FFF7F0' : '#F5F5F5',
                    },
                  }}
                >
                  {lang.label}
                  {isSelected && <CheckIcon sx={{ fontSize: 14, color: '#FF6A00' }} />}
                </Box>
              );
            })}
          </Paper>
        </Popper>
      </Box>
    </ClickAwayListener>
  );
}
