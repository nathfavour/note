import { Link } from '@mui/material';

/**
 * Custom link component for ReactMarkdown that styles links in green
 * Used for post-render formatting of markdown links
 */
export function LinkComponent({ href, children }: { href?: string; children?: React.ReactNode }) {
  if (!href) return <span>{children}</span>;
  
  return (
    <Link
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      sx={{
        color: 'primary.main',
        textDecoration: 'underline',
        fontWeight: 500,
        transition: 'all 0.2s',
        '&:hover': {
          color: 'primary.light',
          opacity: 0.8
        }
      }}
    >
      {children}
    </Link>
  );
}

