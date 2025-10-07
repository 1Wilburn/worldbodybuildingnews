import dynamic from 'next/dynamic'; const GlobalSearch = dynamic(()=>import('@/app/components/GlobalSearch'),{ssr:false}); export default function SearchPage(){return(<div><GlobalSearch/></div>);}
