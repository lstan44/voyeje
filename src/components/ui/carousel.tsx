import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "../../lib/utils";
import { Button } from "./button";

const CarouselContext = React.createContext<{
  orientation?: "horizontal" | "vertical";
  scrollPrev: () => void;
  scrollNext: () => void;
  canScrollPrev: boolean;
  canScrollNext: boolean;
} | null>(null);

function useCarousel() {
  const context = React.useContext(CarouselContext);
  if (!context) {
    throw new Error("useCarousel must be used within a <Carousel />");
  }
  return context;
}

const Carousel = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    orientation?: "horizontal" | "vertical";
  }
>(({ orientation = "horizontal", className, children, ...props }, ref) => {
  const [canScrollPrev, setCanScrollPrev] = React.useState(false);
  const [canScrollNext, setCanScrollNext] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  const scrollPrev = React.useCallback(() => {
    if (containerRef.current) {
      const container = containerRef.current;
      const scrollAmount = orientation === "horizontal"
        ? container.clientWidth
        : container.clientHeight;
      if (orientation === "horizontal") {
        container.scrollTo({
          left: container.scrollLeft - scrollAmount,
          behavior: 'smooth'
        });
      } else {
        container.scrollTo({
          top: container.scrollTop - scrollAmount,
          behavior: 'smooth'
        });
      }
    }
  }, [orientation]);

  const scrollNext = React.useCallback(() => {
    if (containerRef.current) {
      const container = containerRef.current;
      const scrollAmount = orientation === "horizontal"
        ? container.clientWidth
        : container.clientHeight;
      if (orientation === "horizontal") {
        container.scrollTo({
          left: container.scrollLeft + scrollAmount,
          behavior: 'smooth'
        });
      } else {
        container.scrollTo({
          top: container.scrollTop + scrollAmount,
          behavior: 'smooth'
        });
      }
    }
  }, [orientation]);

  React.useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateScrollButtons = () => {
      if (orientation === "horizontal") {
        setCanScrollPrev(container.scrollLeft > 0);
        setCanScrollNext(
          container.scrollLeft < container.scrollWidth - container.clientWidth
        );
      } else {
        setCanScrollPrev(container.scrollTop > 0);
        setCanScrollNext(
          container.scrollTop < container.scrollHeight - container.clientHeight
        );
      }
    };

    updateScrollButtons();
    container.addEventListener("scroll", updateScrollButtons);
    window.addEventListener("resize", updateScrollButtons);

    return () => {
      container.removeEventListener("scroll", updateScrollButtons);
      window.removeEventListener("resize", updateScrollButtons);
    };
  }, [orientation]);

  return (
    <CarouselContext.Provider
      value={{
        orientation,
        scrollPrev,
        scrollNext,
        canScrollPrev,
        canScrollNext,
      }}
    >
      <div
        ref={ref}
        className={cn("relative", className)}
        {...props}
      >
        {children}
      </div>
    </CarouselContext.Provider>
  );
});
Carousel.displayName = "Carousel";

const CarouselContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  const { orientation } = useCarousel();

  return (
    <div
      ref={ref}
      className={cn(
        "relative overflow-hidden",
        className
      )}
    >
      <div
        ref={ref}
        className={cn(
          "flex transition-transform duration-300 ease-in-out",
          orientation === "horizontal" ? "-mx-4" : "-my-4",
          className
        )}
        {...props}
      />
    </div>
  );
});
CarouselContent.displayName = "CarouselContent";

const CarouselItem = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  const { orientation } = useCarousel();

  return (
    <div
      ref={ref}
      role="group"
      aria-roledescription="slide"
      className={cn(
        "min-w-0 shrink-0 grow-0 basis-full px-4",
        orientation === "horizontal" ? "pl-4" : "pt-4",
        className
      )}
      {...props}
    />
  );
});
CarouselItem.displayName = "CarouselItem";

const CarouselPrevious = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<typeof Button>
>(({ className, ...props }, ref) => {
  const { orientation, scrollPrev, canScrollPrev } = useCarousel();

  return (
    <Button
      ref={ref}
      variant="outline"
      size="icon"
      className={cn(
        "absolute h-8 w-8 rounded-full bg-white",
        orientation === "horizontal"
          ? "-left-12 top-1/2 -translate-y-1/2"
          : "-top-12 left-1/2 -translate-x-1/2 rotate-90",
        className
      )}
      disabled={!canScrollPrev}
      onClick={scrollPrev}
      {...props}
    >
      <ChevronLeft className="h-4 w-4" />
      <span className="sr-only">Previous slide</span>
    </Button>
  );
});
CarouselPrevious.displayName = "CarouselPrevious";

const CarouselNext = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<typeof Button>
>(({ className, ...props }, ref) => {
  const { orientation, scrollNext, canScrollNext } = useCarousel();

  return (
    <Button
      ref={ref}
      variant="outline"
      size="icon"
      className={cn(
        "absolute h-8 w-8 rounded-full bg-white",
        orientation === "horizontal"
          ? "-right-12 top-1/2 -translate-y-1/2"
          : "-bottom-12 left-1/2 -translate-x-1/2 rotate-90",
        className
      )}
      disabled={!canScrollNext}
      onClick={scrollNext}
      {...props}
    >
      <ChevronRight className="h-4 w-4" />
      <span className="sr-only">Next slide</span>
    </Button>
  );
});
CarouselNext.displayName = "CarouselNext";

export {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
};