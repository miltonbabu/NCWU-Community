import type { ClassSession } from '@/types/schedule';

const subjectColors = {
  'Human Resource Management': { bg: 'bg-orange-500/20', border: 'border-orange-400/30', text: 'text-orange-100', hover: 'hover:bg-orange-500/30', glow: 'shadow-orange-500/20' },
  'Digital Trade': { bg: 'bg-blue-500/20', border: 'border-blue-400/30', text: 'text-blue-100', hover: 'hover:bg-blue-500/30', glow: 'shadow-blue-500/20' },
  'Economic Methodology': { bg: 'bg-purple-500/20', border: 'border-purple-400/30', text: 'text-purple-100', hover: 'hover:bg-purple-500/30', glow: 'shadow-purple-500/20' },
  'International Trade Practice': { bg: 'bg-rose-500/20', border: 'border-rose-400/30', text: 'text-rose-100', hover: 'hover:bg-rose-500/30', glow: 'shadow-rose-500/20' },
  'Thesis Writing': { bg: 'bg-cyan-500/20', border: 'border-cyan-400/30', text: 'text-cyan-100', hover: 'hover:bg-cyan-500/30', glow: 'shadow-cyan-500/20' },
  'Econometrics': { bg: 'bg-emerald-500/20', border: 'border-emerald-400/30', text: 'text-emerald-100', hover: 'hover:bg-emerald-500/30', glow: 'shadow-emerald-500/20' },
  'International Trade Documents': { bg: 'bg-teal-500/20', border: 'border-teal-400/30', text: 'text-teal-100', hover: 'hover:bg-teal-500/30', glow: 'shadow-teal-500/20' },
  'International Settlement': { bg: 'bg-lime-500/20', border: 'border-lime-400/30', text: 'text-lime-100', hover: 'hover:bg-lime-500/30', glow: 'shadow-lime-500/20' },
  'Chinese Folk Music & Singing': { bg: 'bg-pink-500/20', border: 'border-pink-400/30', text: 'text-pink-100', hover: 'hover:bg-pink-500/30', glow: 'shadow-pink-500/20' },
  'Multinational Corporation Management': { bg: 'bg-amber-500/20', border: 'border-amber-400/30', text: 'text-amber-100', hover: 'hover:bg-amber-500/30', glow: 'shadow-amber-500/20' },
  'International Cargo Transport & Insurance': { bg: 'bg-indigo-500/20', border: 'border-indigo-400/30', text: 'text-indigo-100', hover: 'hover:bg-indigo-500/30', glow: 'shadow-indigo-500/20' },
  'Introduction to Chinese Water Conservancy History': { bg: 'bg-sky-500/20', border: 'border-sky-400/30', text: 'text-sky-100', hover: 'hover:bg-sky-500/30', glow: 'shadow-sky-500/20' },
};

function getShift(startTime) { const h = parseInt(startTime.split(':')[0]); return h < 12 ? 'Morning' : h < 18 ? 'Afternoon' : 'Evening'; }
function parseWeeks(s) { const r=[]; for(const p of s.split(',')) { const t=p.trim(); if(t.includes('-')){ const[a,b]=t.split('-').map(Number); for(let i=a;i<=b;i++)r.push(i); } else r.push(parseInt(t)); } return r; }

function make(id, day, sub, inst, room, start, end, week) {
  const c = subjectColors[sub] || { bg:'bg-slate-500/20', border:'border-slate-400/30', text:'text-slate-100', hover:'hover:bg-slate-500/30', glow:'shadow-slate-500/20' };
  return { id: id+'-w'+week, subject:sub, instructor:inst, room, day, startTime:start, endTime:end, week, shift:getShift(start), ...c };
}

const raw = [
  ['Monday','10:00-11:40','Human Resource Management','Fu Jing','Dragon Building 1 Room 1502','1-8'],
  ['Monday','14:00-15:40','Digital Trade','Zhang Yingzhuo','Dragon Building 1 Room 1502','1-8'],
  ['Monday','14:00-15:40','Economic Methodology','Zheng Jiyuan','Dragon Building 1 Room 1503','11-18'],
  ['Monday','16:00-17:40','International Trade Practice','Fu Jing','Dragon Building 1 Room 1504','1-8'],
  ['Tuesday','08:00-09:40','Thesis Writing','Zhou Yu','Experiment Building S4102','1-8,11-18'],
  ['Tuesday','10:00-11:40','Econometrics','Zheng Jiyuan','Dragon Building 1 Room 1502','1-8'],
  ['Tuesday','14:00-15:40','International Trade Documents','Chen Ke','Dragon Building 1 Room 1503','1-8'],
  ['Tuesday','14:00-15:40','International Settlement','Chen Ke','Dragon Building 1 Room 1502','9-16'],
  ['Tuesday','16:00-17:40','Chinese Folk Music & Singing','Wang Qing','Experiment Building S4102','1-8'],
  ['Wednesday','08:00-09:40','Economic Methodology','Zheng Jiyuan','Dragon Building 1 Room 1503','11-18'],
  ['Wednesday','10:00-11:40','Multinational Corporation Management','Fu Jing','Dragon Building 1 Room 1502','10-17'],
  ['Wednesday','10:00-11:40','Human Resource Management','Fu Jing','Dragon Building 1 Room 1502','1-8'],
  ['Wednesday','14:00-15:40','International Cargo Transport & Insurance','Li Bing','Dragon Building 1 Room 1505','10-17'],
  ['Wednesday','14:00-15:40','Digital Trade','Zhang Yingzhuo','Dragon Building 1 Room 1502','1-8'],
  ['Wednesday','19:00-20:40','Introduction to Chinese Water Conservancy History','Yan Jun','Dragon Building 1 Room 1502','1-16'],
  ['Thursday','10:00-11:40','International Trade Practice','Fu Jing','Dragon Building 1 Room 1504','1-8'],
  ['Thursday','10:00-11:40','International Settlement','Chen Ke','Dragon Building 1 Room 1502','9-16'],
  ['Friday','10:00-11:40','Econometrics','Zheng Jiyuan','Dragon Building 1 Room 1502','1-8'],
  ['Friday','10:00-11:40','International Cargo Transport & Insurance','Li Bing','Dragon Building 1 Room 1505','10-17'],
  ['Friday','14:00-15:40','International Trade Documents','Chen Ke','Dragon Building 1 Room 1502','1-8'],
  ['Friday','14:00-15:40','Multinational Corporation Management','Fu Jing','Dragon Building 1 Room 1502','10-17'],
];

export const economics2023ScheduleData = raw.flatMap((item,i) => {
  const [start,end] = item[1].split('-');
  return parseWeeks(item[5]).map(w => make('econ2023-'+i,item[0],item[2],item[3],item[4],start,end,w));
});

export const economics2023TotalWeeks = 18;

export const economics2023SubjectsList = [
  {name:'Human Resource Management',bg:'bg-orange-500/20',text:'text-orange-100'},
  {name:'Digital Trade',bg:'bg-blue-500/20',text:'text-blue-100'},
  {name:'Economic Methodology',bg:'bg-purple-500/20',text:'text-purple-100'},
  {name:'International Trade Practice',bg:'bg-rose-500/20',text:'text-rose-100'},
  {name:'Thesis Writing',bg:'bg-cyan-500/20',text:'text-cyan-100'},
  {name:'Econometrics',bg:'bg-emerald-500/20',text:'text-emerald-100'},
  {name:'International Trade Documents',bg:'bg-teal-500/20',text:'text-teal-100'},
  {name:'International Settlement',bg:'bg-lime-500/20',text:'text-lime-100'},
  {name:'Chinese Folk Music & Singing',bg:'bg-pink-500/20',text:'text-pink-100'},
  {name:'Multinational Corporation Management',bg:'bg-amber-500/20',text:'text-amber-100'},
  {name:'International Cargo Transport & Insurance',bg:'bg-indigo-500/20',text:'text-indigo-100'},
  {name:'Introduction to Chinese Water Conservancy History',bg:'bg-sky-500/20',text:'text-sky-100'},
];
