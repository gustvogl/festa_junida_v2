import { PageHeader } from './PageHeader';

export function PageScaffold({ eyebrow, title, description, children }) {
  return (
    <section className="page-scaffold">
      <div className="page-banner card">
        <PageHeader eyebrow={eyebrow} title={title} description={description} />
      </div>
      <div className="page-stack">{children}</div>
    </section>
  );
}
