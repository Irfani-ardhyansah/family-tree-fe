type FooterProps = {
  moduleName?: string;
  className?: string;
};

export function Footer({ moduleName, className = '' }: FooterProps) {
  const year = new Date().getFullYear();

  return (
    <footer
      className={[
        'mt-auto border-t border-suite-border bg-suite-bg/80 py-6',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
        <p className="text-sm text-suite-muted">
          © {year} Family Suite
          {moduleName ? ` — ${moduleName}` : null}
        </p>
      </div>
    </footer>
  );
}
