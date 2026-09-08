'use client';
export default function ErrorPage({reset}:{reset:()=>void}){return <main id="main-content" className="wrap error-page"><h1>We couldn’t load this page.</h1><p>Please try again in a moment.</p><button className="button" onClick={reset}>Try again</button></main>}
