import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import isToday from 'dayjs/plugin/isToday'
import isYesterday from 'dayjs/plugin/isYesterday'
dayjs.extend(relativeTime)
dayjs.extend(isToday)
dayjs.extend(isYesterday)

export const today = () => dayjs().format('YYYY-MM-DD')
export const formatDate = (d) => dayjs(d).format('YYYY-MM-DD')
export const prettyDate = (d) => {
  const dj = dayjs(d)
  if (dj.isToday()) return 'Today'
  if (dj.isYesterday()) return 'Yesterday'
  return dj.format('DD MMM YYYY')
}
export const nowTime = () => dayjs().format('HH:mm')
export const dayjs$ = dayjs
