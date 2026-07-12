import { FILM_CHAPTERS } from "./film.config";
import { FilmSection } from "./film-section";
import { FooterSection } from "./footer-section";
import { ProductSection } from "./product-section";

/**
 * The scene stack. `flow-root` contains the chapters' negative top margins
 * (each pulls itself one viewport up, sliding over the still-stuck previous
 * scene — the first one slides over the hero's held frame). Rising z-index
 * keeps every incoming scene above the one it covers. Story chapters render
 * as FilmSection; the product experience renders as ProductSection with the
 * same shell, seams and scrub language.
 */
export function FilmReel() {
  return (
    <div className="relative flow-root">
      {FILM_CHAPTERS.map((chapter, index) => {
        const isLast = index === FILM_CHAPTERS.length - 1;
        const zIndex = 10 + index;
        if (chapter.kind === "product" || chapter.kind === "footer") {
          const Scene = chapter.kind === "product" ? ProductSection : FooterSection;
          return (
            <Scene
              key={chapter.id}
              id={chapter.id}
              src={chapter.src}
              ariaLabel={chapter.ariaLabel}
              length={chapter.length}
              zIndex={zIndex}
              isLast={isLast}
            />
          );
        }
        return <FilmSection key={chapter.id} {...chapter} zIndex={zIndex} isLast={isLast} />;
      })}
    </div>
  );
}
