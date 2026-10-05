/* A line of type that rises out of its own mask. */
export default function Rv({ children, className }) {
  return <span className="rv"><span className={className}>{children}</span></span>;
}
