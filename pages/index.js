import dynamic from 'next/dynamic';
const TravelPlanner = dynamic(() => import('../src/components/TravelPlanner'), { ssr: false });
export default function Home(){ return (<div className='container'><TravelPlanner/></div>); }
