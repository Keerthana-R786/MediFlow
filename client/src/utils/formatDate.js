import { format, formatDistanceToNow, isToday, isTomorrow } from 'date-fns';

export const formatDate = (date) => format(new Date(date), 'dd MMM yyyy');
export const formatDateTime = (date) => format(new Date(date), 'dd MMM yyyy, h:mm a');
export const formatTime = (date) => format(new Date(date), 'h:mm a');
export const formatRelative = (date) => formatDistanceToNow(new Date(date), { addSuffix: true });

export const formatAppointmentDate = (date) => {
  const d = new Date(date);
  if (isToday(d)) return 'Today';
  if (isTomorrow(d)) return 'Tomorrow';
  return format(d, 'EEE, d MMM');
};

export const getAge = (dob) => {
  if (!dob) return null;
  const diff = Date.now() - new Date(dob).getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
};
