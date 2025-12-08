import React from 'react';
import PropTypes from 'prop-types';

/**
 * LiveIndicator - Shows real-time data connection status
 * Provides visual feedback that data is being actively updated
 * @component
 */
export function LiveIndicator({ status = 'live', label = 'LIVE', showLabel = true }) {
    const statusClass = status === 'critical' ? 'critical' : status === 'warning' ? 'warning' : '';

    return (
        <span className={`live-indicator ${statusClass}`}>
            {showLabel && label}
        </span>
    );
}

LiveIndicator.propTypes = {
    status: PropTypes.oneOf(['live', 'warning', 'critical']),
    label: PropTypes.string,
    showLabel: PropTypes.bool,
};

/**
 * PulseValue - Displays a value with pulse animation on update
 * Use for values that change frequently to draw attention
 * @component
 */
export function PulseValue({ value, unit = '', severity = 'normal', size = 'medium', animate = true }) {
    const getSeverityClass = () => {
        switch (severity) {
            case 'critical': return 'glow-red animate-heartbeat';
            case 'warning': return 'glow-orange animate-pulse';
            case 'elevated': return 'glow-yellow';
            case 'good': return 'glow-green';
            default: return '';
        }
    };

    const getSizeStyle = () => {
        switch (size) {
            case 'large': return { fontSize: 'var(--font-size-xl)', fontWeight: 'bold' };
            case 'medium': return { fontSize: 'var(--font-size-lg)', fontWeight: 'bold' };
            case 'small': return { fontSize: 'var(--font-size-base)' };
            default: return {};
        }
    };

    return (
        <span
            className={`pulse-value ${animate ? getSeverityClass() : ''}`}
            style={getSizeStyle()}
        >
            {value}
            {unit && <span style={{ fontSize: '0.7em', opacity: 0.8 }}>{unit}</span>}
        </span>
    );
}

PulseValue.propTypes = {
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    unit: PropTypes.string,
    severity: PropTypes.oneOf(['normal', 'good', 'elevated', 'warning', 'critical']),
    size: PropTypes.oneOf(['small', 'medium', 'large']),
    animate: PropTypes.bool,
};

/**
 * GaugeBar - Animated progress bar with severity coloring
 * Great for showing percentages, levels, or progress
 * @component
 */
export function GaugeBar({
    value,
    max = 100,
    label = '',
    showValue = true,
    severity = 'normal',
    height = 12,
    animated = true
}) {
    const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

    const getColor = () => {
        if (severity === 'auto') {
            if (percentage >= 80) return '#f00';
            if (percentage >= 60) return '#f90';
            if (percentage >= 40) return '#ff0';
            return '#0f0';
        }
        switch (severity) {
            case 'critical': return '#f00';
            case 'warning': return '#f90';
            case 'elevated': return '#ff0';
            case 'good': return '#0f0';
            default: return 'var(--secondary)';
        }
    };

    return (
        <div style={{ marginBottom: '4px' }}>
            {label && (
                <div style={{
                    fontSize: 'var(--font-size-caption)',
                    marginBottom: '2px',
                    display: 'flex',
                    justifyContent: 'space-between'
                }}>
                    <span>{label}</span>
                    {showValue && <span>{value}/{max}</span>}
                </div>
            )}
            <div
                style={{
                    background: 'var(--tertiary)',
                    height: `${height}px`,
                    border: '1px solid var(--secondary)',
                    overflow: 'hidden'
                }}
                className={animated ? 'gauge-animated' : ''}
            >
                <div
                    className="gauge-fill"
                    style={{
                        width: `${percentage}%`,
                        height: '100%',
                        background: getColor(),
                        boxShadow: severity !== 'normal' ? `0 0 8px ${getColor()}` : 'none'
                    }}
                />
            </div>
        </div>
    );
}

GaugeBar.propTypes = {
    value: PropTypes.number.isRequired,
    max: PropTypes.number,
    label: PropTypes.string,
    showValue: PropTypes.bool,
    severity: PropTypes.oneOf(['normal', 'good', 'elevated', 'warning', 'critical', 'auto']),
    height: PropTypes.number,
    animated: PropTypes.bool,
};

/**
 * DataCard - Interactive card with hover effects
 * Use for clickable data items
 * @component
 */
export function DataCard({ children, onClick, highlighted = false, className = '' }) {
    return (
        <div
            className={`interactive-card ${highlighted ? 'animate-glow' : ''} ${className}`}
            onClick={onClick}
            style={{
                padding: '8px',
                border: `1px solid ${highlighted ? '#0f0' : 'var(--secondary)'}`,
                background: 'var(--primary)',
                cursor: onClick ? 'pointer' : 'default',
                marginBottom: '4px'
            }}
        >
            {children}
        </div>
    );
}

DataCard.propTypes = {
    children: PropTypes.node.isRequired,
    onClick: PropTypes.func,
    highlighted: PropTypes.bool,
    className: PropTypes.string,
};

/**
 * SparklineChart - Mini inline chart for trends
 * Shows data trend at a glance
 * @component
 */
export function SparklineChart({
    data,
    width = 100,
    height = 24,
    color = 'var(--secondary)',
    highlightLast = false,
    showExtremes = false
}) {
    if (!data || data.length < 2) return null;

    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;

    const points = data.map((val, i) => {
        const x = (i / (data.length - 1)) * width;
        const y = height - ((val - min) / range) * height;
        return `${x},${y}`;
    }).join(' ');

    const lastValue = data[data.length - 1];
    const lastX = width;
    const lastY = height - ((lastValue - min) / range) * height;

    return (
        <svg width={width} height={height} style={{ display: 'block' }}>
            <polyline
                fill="none"
                stroke={color}
                strokeWidth="1.5"
                points={points}
                className="chart-line"
            />
            {highlightLast && (
                <circle
                    cx={lastX}
                    cy={lastY}
                    r="3"
                    fill={color}
                    className="animate-pulse"
                />
            )}
            {showExtremes && (
                <>
                    <text x="2" y="10" fill={color} fontSize="8">↑{max.toFixed(1)}</text>
                    <text x="2" y={height - 2} fill={color} fontSize="8">↓{min.toFixed(1)}</text>
                </>
            )}
        </svg>
    );
}

SparklineChart.propTypes = {
    data: PropTypes.arrayOf(PropTypes.number).isRequired,
    width: PropTypes.number,
    height: PropTypes.number,
    color: PropTypes.string,
    highlightLast: PropTypes.bool,
    showExtremes: PropTypes.bool,
};

/**
 * CountdownTimer - Shows time until event
 * Great for showing "time until closest approach" etc.
 * @component
 */
export function CountdownTimer({ targetDate, label = '', onComplete }) {
    const [timeLeft, setTimeLeft] = React.useState(calculateTimeLeft());

    function calculateTimeLeft() {
        const difference = new Date(targetDate).getTime() - new Date().getTime();
        if (difference <= 0) return null;

        return {
            days: Math.floor(difference / (1000 * 60 * 60 * 24)),
            hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
            minutes: Math.floor((difference / 1000 / 60) % 60),
            seconds: Math.floor((difference / 1000) % 60),
        };
    }

    React.useEffect(() => {
        const timer = setInterval(() => {
            const newTimeLeft = calculateTimeLeft();
            setTimeLeft(newTimeLeft);
            if (!newTimeLeft && onComplete) {
                onComplete();
                clearInterval(timer);
            }
        }, 1000);
        return () => clearInterval(timer);
    }, [targetDate, onComplete]);

    if (!timeLeft) {
        return <span className="glow-green">Now!</span>;
    }

    return (
        <div style={{ fontFamily: 'Monaco, monospace', fontSize: 'var(--font-size-sm)' }}>
            {label && <div style={{ fontSize: 'var(--font-size-caption)', marginBottom: '2px' }}>{label}</div>}
            <span className="animate-pulse">
                {timeLeft.days > 0 && `${timeLeft.days}d `}
                {String(timeLeft.hours).padStart(2, '0')}:
                {String(timeLeft.minutes).padStart(2, '0')}:
                {String(timeLeft.seconds).padStart(2, '0')}
            </span>
        </div>
    );
}

CountdownTimer.propTypes = {
    targetDate: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]).isRequired,
    label: PropTypes.string,
    onComplete: PropTypes.func,
};

/**
 * ValueChangeIndicator - Shows if value increased/decreased
 * @component
 */
export function ValueChangeIndicator({ currentValue, previousValue }) {
    if (previousValue === undefined || previousValue === null) return null;

    if (currentValue > previousValue) {
        return <span className="value-increased" />;
    } else if (currentValue < previousValue) {
        return <span className="value-decreased" />;
    }
    return <span className="value-stable" />;
}

ValueChangeIndicator.propTypes = {
    currentValue: PropTypes.number.isRequired,
    previousValue: PropTypes.number,
};

// Export all components
export default {
    LiveIndicator,
    PulseValue,
    GaugeBar,
    DataCard,
    SparklineChart,
    CountdownTimer,
    ValueChangeIndicator,
};
