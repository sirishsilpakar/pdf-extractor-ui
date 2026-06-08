import { formatDateTime, formatRelativeTime, formatTime } from "./date";
import {
  formatChars,
  formatFileSize,
  formatNumber,
  formatNumCompact,
  formatPercent,
} from "./number";

export const format = {
  chars: formatChars,
  dateTime: formatDateTime,
  fileSize: formatFileSize,
  number: formatNumber,
  numCompact: formatNumCompact,
  percent: formatPercent,
  relativeTime: formatRelativeTime,
  time: formatTime,
};
