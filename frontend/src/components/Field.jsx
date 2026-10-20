import Icon from './Icon.jsx';

export default function Field({ id, label, error, hint, children }) {
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      {children}
      {hint && !error && <span className="hint" id={`${id}-hint`}>{hint}</span>}
      {error && (
        <span className="error" id={`${id}-err`} role="alert">
          <Icon name="awas" size={16} />
          {error}
        </span>
      )}
    </div>
  );
}

export const describe = (id, error, hint) =>
  ({ 'aria-invalid': error ? 'true' : undefined, 'aria-describedby': error ? `${id}-err` : hint ? `${id}-hint` : undefined });
