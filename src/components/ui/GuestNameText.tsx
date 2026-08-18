import { Fragment } from "react";

const WHOLE_NAME_NOWRAP_LIMIT = 34;

export function GuestNameText({ text }: { text: string }) {
  const normalized = text.trim();
  const names = normalized.split(/\s*&\s*/);

  if (names.length === 1) {
    return (
      <span data-guest-name="true" className="text-balance">
        {normalized}
      </span>
    );
  }

  const keepWholePairTogether = normalized.length <= WHOLE_NAME_NOWRAP_LIMIT;

  return (
    <span
      data-guest-name="true"
      className={keepWholePairTogether ? "whitespace-nowrap" : "text-balance"}
    >
      {names.map((name, index) => (
        <Fragment key={`${name}-${index}`}>
          {index === 0 ? name : (
            <span className="whitespace-nowrap">
              {" & "}{name}
            </span>
          )}
        </Fragment>
      ))}
    </span>
  );
}
