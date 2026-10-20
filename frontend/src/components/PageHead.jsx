import { useEffect } from 'react';

export default function PageHead({ title, desc, children }) {
  useEffect(() => { document.title = `${title} | E-Apotek`; }, [title]);
  return (
    <header className="page-head">
      <div>
        <h1>{title}</h1>
        {desc && <p>{desc}</p>}
      </div>
      {children && <div className="page-actions">{children}</div>}
    </header>
  );
}
