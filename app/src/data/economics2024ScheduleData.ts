import type { ClassSession } from '@/types/schedule';

const subjectColors = {
  'Finance': { bg: 'bg-emerald-500/20', border: 'border-emerald-400/30', text: 'text-emerald-100', hover: 'hover:bg-emerald-500/30', glow: 'shadow-emerald-500/20' },
  'Chinese Culture': { bg: 'bg-red-500/20', border: 'border-red-400/30', text: 'text-red-100', hover: 'hover:bg-red-500/30', glow: 'shadow-red-500/20' },
  'Accounting': { bg: 'bg-blue-500/20', border: 'border-blue-400/30', text: 'text-blue-100', hover: 'hover:bg-blue-500/30', glow: 'shadow-blue-500/20' },
  'E-Commerce': { bg: 'bg-violet-500/20', border: 'border-violet-400/30', text: 'text-violet-100', hover: 'hover:bg-violet-500/30', glow: 'shadow-violet-500/20' },
  'Chinese Folk Music': { bg: 'bg-pink-500/20', border: 'border-pink-400/30', text: 'text-pink-100', hover: 'hover:bg-pink-500/30', glow: 'shadow-pink-500/20' },
  'Innovation & Entrepreneurship': { bg: 'bg-amber-500/20', border: 'border-amber-400/30', text: 'text-amber-100', hover: 'hover:bg-amber-500/30', glow: 'shadow-amber-500/20' },
  'PE 3': { bg: 'bg-green-500/20', border: 'border-green-400/30', text: 'text-green-100', hover: 'hover:bg-green-500/30', glow: 'shadow-green-500/20' },
  'HSK Training 2': { bg: 'bg-cyan-500/20', border: 'border-cyan-400/30', text: 'text-cyan-100', hover: 'hover:bg-cyan-500/30', glow: 'shadow-cyan-500/20' },
  'Chinese Characters & Culture': { bg: 'bg-orange-500/20', border: 'border-orange-400/30', text: 'text-orange-100', hover: 'hover:bg-orange-500/30', glow: 'shadow-orange-500/20' },
  'International Economics': { bg: 'bg-indigo-500/20', border: 'border-indigo-400/30', text: 'text-indigo-100', hover: 'hover:bg-indigo-500/30', glow: 'shadow-indigo-500/20' },
  'Probability & Statistics A': { bg: 'bg-teal-500/20', border: 'border-teal-400/30', text: 'text-teal-100', hover: 'hover:bg-teal-500/30', glow: 'shadow-teal-500/20' },
};

function getShift(startTime) { const h = parseInt(startTime.split(':')[0]); return h < 12 ? 'Morning' : h < 18 ? 'Afternoon' : 'Evening'; }
function parseWeeks(s) { const r=[]; for(const p of s.split(',')) { const t=p.trim(); if(t.includes('-')){ const[a,b]=t.split('-').map(Number); for(let i=a;i<=b;i++)r.push(i); } else r.push(parseInt(t)); } return r; }

function make(id, day, sub, inst, room, start, end, week) {
  const c = subjectColors[sub] || { bg:'bg-slate-500/20', border:'border-slate-400/30', text:'text-slate-100', hover:'hover:bg-slate-500/30', glow:'shadow-slate-500/20' };
  return { id: id+'-w'+week, subject:sub, instructor:inst, room, day, startTime:start, endTime:end, week, shift:getShift(start), ...c };
}

const raw = [
  ['Monday','10:00-11:40','Finance','Shao Dan','Dragon Building 1 Room 1502','9-16'],
  ['Monday','16:00-17:40','Chinese Culture','Wang Zhiwang','Dragon Building 1 Room 1503','1-16'],
  ['Tuesday','10:00-11:40','Accounting','Liu Qian','Dragon Building 1 Room 1503','1-8'],
  ['Tuesday','10:00-11:40','E-Commerce','Zhu Hanyu','Dragon Building 1 Room 1501','10-13'],
  ['Tuesday','10:00-11:40','E-Commerce','Li Xiaodong','Dragon Building 1 Room 1501','14-17'],
  ['Tuesday','14:00-15:40','Chinese Folk Music','Wang Qing','Experiment Building S4102','1-16'],
  ['Tuesday','16:00-17:40','Innovation & Entrepreneurship','Wang Shijia','Dragon Building 2 Room 2502','11-14'],
  ['Wednesday','08:00-09:40','PE 3','Li Pei','Dragon Building 1 Room 1503','1-16'],
  ['Wednesday','10:00-11:40','HSK Training 2','Sha Cheng','Dragon Building 1 Room 1503','1-16'],
  ['Wednesday','14:00-15:40','Chinese Characters & Culture','Wang Xuan','Dragon Building 1 Room 1503','1-16'],
  ['Wednesday','16:00-17:40','International Economics','Zheng Shuyao','Dragon Building 1 Room 1502','1-10'],
  ['Thursday','10:00-11:40','Probability & Statistics A','Zhai Yanli','Dragon Building 1 Room 1503','1-8'],
  ['Thursday','10:00-11:40','E-Commerce','Zhu Hanyu','Dragon Building 1 Room 1501','10-13'],
  ['Thursday','10:00-11:40','E-Commerce','Li Xiaodong','Dragon Building 1 Room 1501','14-17'],
  ['Friday','10:00-11:40','Probability & Statistics A','Zhai Yanli','Dragon Building 1 Room 1503','1-8'],
  ['Friday','10:00-11:40','Finance','Shao Dan','Dragon Building 1 Room 1502','9-16'],
  ['Friday','14:00-15:40','International Economics','Zheng Shuyao','Dragon Building 1 Room 1505','1-9'],
  ['Friday','16:00-17:40','Accounting','Liu Qian','Dragon Building 1 Room 1503','1-8'],
];

export const economics2024ScheduleData = raw.flatMap((item,i) => {
  const [start,end] = item[1].split('-');
  return parseWeeks(item[5]).map(w => make('econ2024-'+i,item[0],item[2],item[3],item[4],start,end,w));
});

export const economics2024TotalWeeks = 17;

export const economics2024SubjectsList = [
  {name:'Finance',bg:'bg-emerald-500/20',text:'text-emerald-100'},
  {name:'Chinese Culture',bg:'bg-red-500/20',text:'text-red-100'},
  {name:'Accounting',bg:'bg-blue-500/20',text:'text-blue-100'},
  {name:'E-Commerce',bg:'bg-violet-500/20',text:'text-violet-100'},
  {name:'Chinese Folk Music',bg:'bg-pink-500/20',text:'text-pink-100'},
  {name:'Innovation & Entrepreneurship',bg:'bg-amber-500/20',text:'text-amber-100'},
  {name:'PE 3',bg:'bg-green-500/20',text:'text-green-100'},
  {name:'HSK Training 2',bg:'bg-cyan-500/20',text:'text-cyan-100'},
  {name:'Chinese Characters & Culture',bg:'bg-orange-500/20',text:'text-orange-100'},
  {name:'International Economics',bg:'bg-indigo-500/20',text:'text-indigo-100'},
  {name:'Probability & Statistics A',bg:'bg-teal-500/20',text:'text-teal-100'},
];
