import { useRef, useEffect, useState } from 'react';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { useIsMobile } from '../Hooks/useIsMobile';

function StatCarousel({ items, renderCard, autoRotate = true, rotateInterval = 4000 }) {
    const [active, setActive] = useState(0);
    const carouselRef = useRef(null);
    const [isInView, setIsInView] = useState(false);
    const [isHovering, setIsHovering] = useState(false);
    const [touchStart, setTouchStart] = useState(null);
    const [touchEnd, setTouchEnd] = useState(null);
    const isMobile = useIsMobile(768);
    const minSwipeDistance = 50;

    useEffect(() => {
        if (autoRotate && isInView && !isHovering && items.length > 0) {
            const interval = setInterval(() => {
                setActive((prev) => (prev + 1) % items.length);
            }, rotateInterval);
            return () => clearInterval(interval);
        }
    }, [isInView, isHovering, autoRotate, rotateInterval, items.length]);

    useEffect(() => {
        if (!carouselRef.current) return;
        const observer = new IntersectionObserver(
            ([entry]) => setIsInView(entry.isIntersecting),
            { threshold: 0.2 }
        );
        observer.observe(carouselRef.current);
        return () => observer.disconnect();
    }, []);

    const onTouchStart = (e) => {
        setTouchStart(e.targetTouches[0].clientX);
        setTouchEnd(null);
    };

    const onTouchMove = (e) => {
        setTouchEnd(e.targetTouches[0].clientX);
    };

    const onTouchEnd = () => {
        if (touchStart == null || touchEnd == null) return;
        const distance = touchStart - touchEnd;
        if (distance > minSwipeDistance) {
            setActive((prev) => (prev + 1) % items.length);
        } else if (distance < -minSwipeDistance) {
            setActive((prev) => (prev - 1 + items.length) % items.length);
        }
    };

    const getCardAnimationClass = (index) => {
        if (items.length <= 1) return 'stat-carousel-card-active';
        if (index === active) return 'stat-carousel-card-active';
        if (index === (active + 1) % items.length) return 'stat-carousel-card-right';
        if (index === (active - 1 + items.length) % items.length) return 'stat-carousel-card-left';
        return 'stat-carousel-card-hidden';
    };

    if (!items.length) return null;

    return (
        <section className="stat-carousel" aria-label="Dashboard statistics">
            <div
                className="stat-carousel-track"
                ref={carouselRef}
                onMouseEnter={() => setIsHovering(true)}
                onMouseLeave={() => setIsHovering(false)}
                onTouchStart={onTouchStart}
                onTouchMove={onTouchMove}
                onTouchEnd={onTouchEnd}
            >
                <div className="stat-carousel-cards">
                    {items.map((item, index) => (
                        <div
                            key={item.label}
                            className={`stat-carousel-card ${getCardAnimationClass(index)}`}
                        >
                            {renderCard(item)}
                        </div>
                    ))}
                </div>

                {!isMobile && items.length > 1 && (
                    <>
                        <button
                            type="button"
                            className="stat-carousel-btn stat-carousel-btn-prev"
                            onClick={() => setActive((prev) => (prev - 1 + items.length) % items.length)}
                            aria-label="Previous"
                        >
                            <FiChevronLeft size={20} />
                        </button>
                        <button
                            type="button"
                            className="stat-carousel-btn stat-carousel-btn-next"
                            onClick={() => setActive((prev) => (prev + 1) % items.length)}
                            aria-label="Next"
                        >
                            <FiChevronRight size={20} />
                        </button>
                    </>
                )}

                {items.length > 1 && (
                    <div className="stat-carousel-dots">
                        {items.map((_, idx) => (
                            <button
                                key={idx}
                                type="button"
                                className={`stat-carousel-dot ${active === idx ? 'stat-carousel-dot-active' : ''}`}
                                onClick={() => setActive(idx)}
                                aria-label={`Go to item ${idx + 1}`}
                            />
                        ))}
                    </div>
                )}
            </div>
        </section>
    );
}

export default StatCarousel;
