import { IconType } from 'react-icons'

interface StatCardProps {
    title: string
    value: number | string
    icon: IconType
    color: string
    trend?: string
}

export default function StatCard({ title, value, icon: Icon, color, trend }: StatCardProps) {
    return (
        <div className="fade-in" style={{
            backgroundColor: 'white',
            padding: '24px',
            borderRadius: '16px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            transition: 'transform 0.2s',
        }}
            onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
            onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
        >
            <div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', fontWeight: '500', marginBottom: '8px' }}>
                    {title}
                </p>
                <h3 style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--text-primary)', lineHeight: 1 }}>
                    {value}
                </h3>
                {trend && (
                    <p style={{ fontSize: '0.75rem', color: '#10b981', marginTop: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span>↑</span> {trend} vs mois dernier
                    </p>
                )}
            </div>
            <div style={{
                padding: '12px',
                borderRadius: '12px',
                backgroundColor: `${color}15`, // 15% opacity
                color: color,
            }}>
                <Icon size={24} />
            </div>
        </div>
    )
}
