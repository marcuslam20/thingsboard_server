import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import CardActionArea from '@mui/material/CardActionArea';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import TextFieldsIcon from '@mui/icons-material/TextFields';
import TableChartIcon from '@mui/icons-material/TableChart';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import BarChartIcon from '@mui/icons-material/BarChart';
import SpeedIcon from '@mui/icons-material/Speed';
import WarningIcon from '@mui/icons-material/Warning';
import SmartButtonIcon from '@mui/icons-material/SmartButton';
import { useDashboardContext } from '../context/DashboardContext';
import { getAllWidgetTypes, WidgetTypeInfo } from '../widgets/WidgetRegistry';
import { Widget } from '@/models/dashboard.model';

const ICON_MAP: Record<string, React.ReactNode> = {
  CreditCard: <CreditCardIcon sx={{ fontSize: 40 }} />,
  TextFields: <TextFieldsIcon sx={{ fontSize: 40 }} />,
  TableChart: <TableChartIcon sx={{ fontSize: 40 }} />,
  ShowChart: <ShowChartIcon sx={{ fontSize: 40 }} />,
  BarChart: <BarChartIcon sx={{ fontSize: 40 }} />,
  Speed: <SpeedIcon sx={{ fontSize: 40 }} />,
  Warning: <WarningIcon sx={{ fontSize: 40 }} />,
  SmartButton: <SmartButtonIcon sx={{ fontSize: 40 }} />,
};

interface AddWidgetDialogProps {
  open: boolean;
  onClose: () => void;
}

export default function AddWidgetDialog({ open, onClose }: AddWidgetDialogProps) {
  const { dispatch } = useDashboardContext();
  const widgetTypes = getAllWidgetTypes();

  const handleSelect = (info: WidgetTypeInfo) => {
    const widgetId = `w_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const widget: Widget = {
      id: widgetId,
      type: info.widgetType,
      title: info.label,
      sizeX: info.defaultSizeX,
      sizeY: info.defaultSizeY,
      row: 0,
      col: 0,
      config: {
        title: info.label,
        showTitle: true,
        datasources: [],
        settings: { widgetType: info.type },
      },
    };
    dispatch({ type: 'ADD_WIDGET', widget });
    dispatch({ type: 'SELECT_WIDGET', widgetId });
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Add Widget</DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ pt: 1 }}>
          {widgetTypes.map((info) => (
            <Grid item xs={6} sm={4} md={3} key={info.type}>
              <Card variant="outlined">
                <CardActionArea onClick={() => handleSelect(info)} sx={{ p: 2 }}>
                  <CardContent sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 1,
                    p: '0 !important',
                  }}>
                    {ICON_MAP[info.icon] || <CreditCardIcon sx={{ fontSize: 40 }} />}
                    <Typography variant="subtitle2" align="center">
                      {info.label}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" align="center">
                      {info.description}
                    </Typography>
                  </CardContent>
                </CardActionArea>
              </Card>
            </Grid>
          ))}
        </Grid>
      </DialogContent>
    </Dialog>
  );
}
