import Head from 'next/head';
import '../styles/globals.css';
export default function App({ Component, pageProps }) { return (<><Head><title>Trips Genie — Budget Your Travel</title></Head><Component {...pageProps} /></>); }