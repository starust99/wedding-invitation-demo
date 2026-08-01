import { Fragment } from "react";
import { segmentExactPhrase } from "@/lib/couple-name-display";

export function CoupleNameText({ text, coupleName }: { text: string; coupleName: string }) {
  return (
    <>
      {segmentExactPhrase(text, coupleName).map((segment, index) => (
        <Fragment key={`${index}-${segment.text}`}>
          {segment.isMatch ? (
            <span className="whitespace-nowrap" data-couple-name="true">
              {segment.text}
            </span>
          ) : segment.text}
        </Fragment>
      ))}
    </>
  );
}
