import React from "react";

export type Bullet = {
  icon?: React.ReactNode | string;
  text?: React.ReactNode;
};

export type PlaygroundWelcomeCardProps = {
  title: React.ReactNode;
  description: React.ReactNode;
  className?: string;
  cardClassName?: string;
  cardHeading?: React.ReactNode;
  cardLead?: React.ReactNode;
  bullets?: Bullet[];
  formula?: React.ReactNode;
  questionIntro?: React.ReactNode;
  question?: React.ReactNode;
  rtl?: boolean;
};

function BulletIcon({ icon }: { icon?: React.ReactNode | string }) {
  if (!icon) return null;
  return (
    <span className="text-2xl ml-2" aria-hidden>
      {typeof icon === "string" ? icon : icon}
    </span>
  );
}

export default function PlaygroundWelcomeCard({
  title,
  description,
  className,
  cardClassName,
  cardHeading,
  cardLead,
  bullets,
  formula,
  questionIntro,
  question,
  rtl = true,
}: PlaygroundWelcomeCardProps) {
  const dir = rtl ? "rtl" : undefined;

  return (
    <div
      dir={dir}
      className={`flex flex-col items-center justify-center h-full p-4 ${className ?? ""}`}
    >
      {(title || description) && (
        <div className="text-center mb-6 max-w-2xl">
          {title && <h3 className="text-xl font-bold mb-2">{title}</h3>}
          {description && (
            <p className="text-muted-foreground max-w-md mx-auto">
              {description}
            </p>
          )}
        </div>
      )}

      {(cardHeading ||
        cardLead ||
        (bullets && bullets.length) ||
        formula ||
        question) && (
        <div
          className={`max-w-2xl bg-white rounded-lg p-6 shadow-md border-2 border-purple-300 ${cardClassName ?? ""}`}
        >
          {cardHeading && (
            <h3 className="text-2xl font-bold mb-3 text-purple-700">
              {cardHeading}
            </h3>
          )}

          {cardLead && (
            <p className="text-xl mb-4 font-bold text-gray-800">{cardLead}</p>
          )}

          {bullets && bullets.length > 0 && (
            <div className="space-y-2 my-4">
              {bullets.map((b, i) => (
                <div key={i} className="flex items-center">
                  <BulletIcon icon={b.icon} />
                  <span>{b.text}</span>
                </div>
              ))}
            </div>
          )}

          {formula && (
            <p className="text-xl font-bold text-purple-700 my-3">{formula}</p>
          )}

          {(questionIntro || question) && (
            <div className="mt-4 pt-3 border-t border-gray-200">
              {questionIntro && (
                <p className="text-gray-800 font-semibold">{questionIntro}</p>
              )}
              {question && (
                <p className="text-gray-800 font-bold">{question}</p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
