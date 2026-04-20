import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { jsPDF } from 'jspdf';
import Header from '../components/Header';
import Footer from '../components/Footer';
import api from '../api';
import '../styles/UserReports.css';
import { useTitle } from '../Hooks/useTitle';

const REPORT_OPTIONS = [
    { id: 'program_batch', label: 'Alumni Registered per Program per Batch' },
    { id: 'employment_income', label: 'Alumni and Latest Employment with Monthly Income Range' },
    { id: 'employment_alignment', label: 'Alumni and Latest Employment Alignment to Degree' },
];

function UserReports() {
    useTitle('User Reports');

    const [activeReport, setActiveReport] = useState('program_batch');
    const [filters, setFilters] = useState({
        program: '',
        batch: '',
        start_date: '',
        end_date: '',
        include_missing: true,
    });
    const [appliedFilters, setAppliedFilters] = useState(filters);
    const [summary, setSummary] = useState(null);
    const [detail, setDetail] = useState({ report: activeReport, count: 0, results: [] });
    const [loadingSummary, setLoadingSummary] = useState(true);
    const [loadingDetail, setLoadingDetail] = useState(true);
    const [error, setError] = useState('');

    const queryString = useMemo(() => {
        const params = new URLSearchParams();
        if (appliedFilters.program) params.set('program', appliedFilters.program);
        if (appliedFilters.batch) params.set('batch', appliedFilters.batch);
        if (appliedFilters.start_date) params.set('start_date', appliedFilters.start_date);
        if (appliedFilters.end_date) params.set('end_date', appliedFilters.end_date);
        params.set('include_missing', appliedFilters.include_missing ? 'true' : 'false');
        return params.toString();
    }, [appliedFilters]);

    useEffect(() => {
        setLoadingSummary(true);
        setError('');
        api.get(`/api/users/reports/summary/?${queryString}`)
            .then((res) => setSummary(res.data))
            .catch(() => setError('Failed to load report summary.'))
            .finally(() => setLoadingSummary(false));
    }, [queryString]);

    useEffect(() => {
        setLoadingDetail(true);
        setError('');
        const qs = `${queryString}&report=${encodeURIComponent(activeReport)}`;
        api.get(`/api/users/reports/detail/?${qs}`)
            .then((res) => setDetail(res.data))
            .catch(() => setError('Failed to load report details.'))
            .finally(() => setLoadingDetail(false));
    }, [queryString, activeReport]);

    const handleFilterChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFilters((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    };

    const handleApply = () => setAppliedFilters(filters);

    const handleReset = () => {
        const reset = {
            program: '',
            batch: '',
            start_date: '',
            end_date: '',
            include_missing: true,
        };
        setFilters(reset);
        setAppliedFilters(reset);
    };

    const reportRows = detail?.results || [];

    const detailColumns = useMemo(() => {
        if (activeReport === 'program_batch') {
            return [
                ['name', 'Name'],
                ['username', 'Username'],
                ['email', 'Email'],
                ['program', 'Program'],
                ['batch', 'Batch'],
                ['date_registered', 'Date Registered'],
            ];
        }
        if (activeReport === 'employment_income') {
            return [
                ['name', 'Name'],
                ['program', 'Program'],
                ['batch', 'Batch'],
                ['latest_job_title', 'Latest Job Title'],
                ['latest_company_name', 'Latest Company'],
                ['income_range', 'Monthly Income Range'],
                ['is_marked_current', 'Marked Current'],
            ];
        }
        return [
            ['name', 'Name'],
            ['program', 'Program'],
            ['batch', 'Batch'],
            ['latest_job_title', 'Latest Job Title'],
            ['latest_company_name', 'Latest Company'],
            ['alignment', 'Alignment'],
            ['is_marked_current', 'Marked Current'],
        ];
    }, [activeReport]);

    const exportPdf = () => {
        if (!reportRows.length) {
            window.alert('No rows available to export.');
            return;
        }
        const doc = new jsPDF();
        const title = REPORT_OPTIONS.find((opt) => opt.id === activeReport)?.label || 'User Report';
        const generatedAt = new Date().toLocaleString();
        const filenameBase = activeReport.replace(/_/g, '-');
        let y = 16;

        const writeLine = (text = '') => {
            if (y > 280) {
                doc.addPage();
                y = 16;
            }
            const lines = doc.splitTextToSize(String(text), 180);
            doc.text(lines, 14, y);
            y += lines.length * 6;
        };

        const formatValue = (row, key) => {
            if (key === 'is_marked_current') return row[key] ? 'Yes' : 'No';
            return row[key] || '—';
        };

        doc.setFontSize(14);
        writeLine(`User Report: ${title}`);
        doc.setFontSize(11);
        writeLine(`Generated: ${generatedAt}`);
        writeLine(
            `Filters -> Program: ${appliedFilters.program || 'All'}, Batch: ${appliedFilters.batch || 'All'}, Date: ${appliedFilters.start_date || 'Any'} to ${appliedFilters.end_date || 'Any'}, Include missing data: ${appliedFilters.include_missing ? 'Yes' : 'No'}`
        );
        writeLine(`Total rows: ${reportRows.length}`);
        y += 2;

        reportRows.forEach((row, idx) => {
            writeLine(`${idx + 1}. ${row.name || row.username || '—'}`);
            detailColumns.forEach(([key, label]) => {
                writeLine(`   ${label}: ${formatValue(row, key)}`);
            });
            y += 2;
        });

        doc.save(`user-report-${filenameBase}.pdf`);
    };

    const alignment = summary?.report_4_alignment_breakdown || {};
    const percentages = alignment.percentages || {};

    return (
        <div className="user-reports-page">
            <Header />
            <main className="user-reports-main">
                <h1 className="user-reports-title">User Reports</h1>
                <p className="user-reports-subtitle">Generate alumni reports with filters and export to PDF.</p>

                <section className="user-reports-filters-card">
                    <div className="user-reports-filters-grid">
                        <label>
                            Program
                            <select name="program" value={filters.program} onChange={handleFilterChange}>
                                <option value="">All</option>
                                <option value="CS">CS</option>
                                <option value="IT">IT</option>
                                <option value="IS">IS</option>
                            </select>
                        </label>
                        <label>
                            Batch
                            <input name="batch" value={filters.batch} onChange={handleFilterChange} placeholder="e.g., 2024" />
                        </label>
                        <label>
                            Registered from
                            <input type="date" name="start_date" value={filters.start_date} onChange={handleFilterChange} />
                        </label>
                        <label>
                            Registered to
                            <input type="date" name="end_date" value={filters.end_date} onChange={handleFilterChange} />
                        </label>
                    </div>
                    <label className="user-reports-checkbox">
                        <input
                            type="checkbox"
                            name="include_missing"
                            checked={filters.include_missing}
                            onChange={handleFilterChange}
                        />
                        Include alumni with missing employment data
                    </label>
                    <div className="user-reports-filter-actions">
                        <button type="button" className="user-reports-btn primary" onClick={handleApply}>Apply Filters</button>
                        <button type="button" className="user-reports-btn" onClick={handleReset}>Reset</button>
                    </div>
                </section>

                <section className="user-reports-switcher">
                    {REPORT_OPTIONS.map((opt) => (
                        <button
                            key={opt.id}
                            type="button"
                            className={`user-reports-tab ${activeReport === opt.id ? 'active' : ''}`}
                            onClick={() => setActiveReport(opt.id)}
                        >
                            {opt.label}
                        </button>
                    ))}
                </section>

                {error && <p className="user-reports-error">{error}</p>}

                <section className="user-reports-summary-grid">
                    <article className="user-reports-stat-card">
                        <h3>Total Alumni</h3>
                        <strong>{loadingSummary ? '...' : (summary?.totals?.alumni_count ?? 0)}</strong>
                    </article>
                    <article className="user-reports-stat-card">
                        <h3>Aligned to Degree</h3>
                        <strong>
                            {loadingSummary ? '...' : `${alignment.aligned ?? 0} (${percentages.aligned ?? 0}%)`}
                        </strong>
                    </article>
                    <article className="user-reports-stat-card">
                        <h3>Not Aligned</h3>
                        <strong>
                            {loadingSummary ? '...' : `${alignment.not_aligned ?? 0} (${percentages.not_aligned ?? 0}%)`}
                        </strong>
                    </article>
                    <article className="user-reports-stat-card">
                        <h3>No Employment Data</h3>
                        <strong>
                            {loadingSummary ? '...' : `${alignment.no_data ?? 0} (${percentages.no_data ?? 0}%)`}
                        </strong>
                    </article>
                </section>

                <section className="user-reports-table-card">
                    <div className="user-reports-table-head">
                        <h2>{REPORT_OPTIONS.find((opt) => opt.id === activeReport)?.label}</h2>
                        <button type="button" className="user-reports-btn primary" onClick={exportPdf}>
                            Generate PDF
                        </button>
                    </div>
                    <p className="user-reports-count">
                        {loadingDetail ? 'Loading rows...' : `${detail.count || 0} result(s)`}
                    </p>
                    <div className="user-reports-table-wrap">
                        <table className="user-reports-table">
                            <thead>
                                <tr>
                                    {detailColumns.map(([, label]) => (
                                        <th key={label}>{label}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {!loadingDetail && reportRows.length === 0 && (
                                    <tr>
                                        <td colSpan={detailColumns.length} className="user-reports-empty">No data found.</td>
                                    </tr>
                                )}
                                {reportRows.map((row) => (
                                    <tr key={`${activeReport}-${row.user_id}-${row.username}`}>
                                        {detailColumns.map(([key]) => (
                                            <td key={`${row.user_id}-${key}`}>
                                                {key === 'is_marked_current' ? (row[key] ? 'Yes' : 'No') : (row[key] || '—')}
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>

                <section className="user-reports-mini-grid">
                    <article className="user-reports-mini-card">
                        <h3>Program/Batch Grouped Counts</h3>
                        <div className="user-reports-mini-wrap">
                            {(summary?.report_1_program_batch_counts || []).slice(0, 12).map((item, idx) => (
                                <p key={`${item.program}-${item.batch}-${idx}`}>
                                    <span>{item.program} - {item.batch}</span>
                                    <strong>{item.count}</strong>
                                </p>
                            ))}
                            {!loadingSummary && (!summary?.report_1_program_batch_counts || summary.report_1_program_batch_counts.length === 0) && (
                                <p className="user-reports-empty">No grouped rows.</p>
                            )}
                        </div>
                    </article>

                    <article className="user-reports-mini-card">
                        <h3>Income Range Grouped Counts</h3>
                        <div className="user-reports-mini-wrap">
                            {(summary?.report_2_income_range_counts || []).map((item) => (
                                <p key={item.income_range}>
                                    <span>{item.income_range}</span>
                                    <strong>{item.count}</strong>
                                </p>
                            ))}
                            {!loadingSummary && (!summary?.report_2_income_range_counts || summary.report_2_income_range_counts.length === 0) && (
                                <p className="user-reports-empty">No grouped rows.</p>
                            )}
                        </div>
                    </article>
                </section>

                <div className="user-reports-back-row">
                    <Link to="/dashboard/users" className="user-reports-back-link">← Back to User Management</Link>
                    <Link to="/dashboard" className="user-reports-back-link">Back to Dashboard</Link>
                </div>
            </main>
            <Footer />
        </div>
    );
}

export default UserReports;
