type SiteFooterProps = { siteName: string; contactEmail: string };

export function SiteFooter({ siteName, contactEmail }: SiteFooterProps) {
  return (
    <footer className="site-footer">
      <div className="container">
        <small>© {new Date().getFullYear()} {siteName}</small>
        {contactEmail ? <a href={`mailto:${contactEmail}`}>{contactEmail}</a> : null}
      </div>
    </footer>
  );
}
