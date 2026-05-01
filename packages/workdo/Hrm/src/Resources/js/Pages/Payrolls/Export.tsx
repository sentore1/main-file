import { useEffect } from 'react';
import { Head, usePage } from '@inertiajs/react';
import { formatCurrency } from '@/utils/helpers';

interface PayrollEntry {
    employee: {
        user: { name: string };
        designation?: { designation_name: string };
    };
    basic_salary: number;
    total_allowances: number;
    gross_pay: number;
    total_deductions: number;
    total_employer_contributions: number;
    net_pay: number;
    allowances_breakdown: Record<string, number>;
    deductions_breakdown: Record<string, number>;
    employer_contributions_breakdown: Record<string, number>;
}

interface Payroll {
    title: string;
    pay_period_start: string;
    pay_period_end: string;
    payrollEntries?: PayrollEntry[];
    payroll_entries?: PayrollEntry[];
}

export default function Export() {
    const { payroll } = usePage<{ payroll: Payroll }>().props;
    const entries = payroll.payrollEntries || payroll.payroll_entries || [];

    useEffect(() => {
        // Auto-print when page loads
        window.print();
    }, []);

    return (
        <>
            <Head title={`Export ${payroll.title}`} />
            
            <div className="p-8 bg-white" style={{ minWidth: '1200px' }}>
                <style>{`
                    @media print {
                        body { margin: 0; }
                        @page { size: landscape; margin: 0.5cm; }
                    }
                    table { border-collapse: collapse; width: 100%; font-size: 11px; }
                    th, td { border: 1px solid #000; padding: 4px 6px; text-align: left; }
                    th { background-color: #90EE90; font-weight: bold; }
                    .yellow-bg { background-color: #FFFF00 !important; }
                    .text-right { text-align: right; }
                    .text-center { text-align: center; }
                `}</style>

                <h1 className="text-center text-xl font-bold mb-4">
                    PAYROLL STAFF EAST GATE HOTEL {new Date(payroll.pay_period_start).toLocaleString('default', { month: 'long', year: 'numeric' }).toUpperCase()}
                </h1>

                <table>
                    <thead>
                        <tr>
                            <th rowSpan={2}>No</th>
                            <th rowSpan={2}>NAMES</th>
                            <th rowSpan={2}>Post</th>
                            <th rowSpan={2}>Basic salary</th>
                            <th rowSpan={2}>TRANSPORT</th>
                            <th rowSpan={2}>Gross salary</th>
                            <th colSpan={2}>PENSION</th>
                            <th colSpan={2} className="yellow-bg">PENSION</th>
                            <th colSpan={2}>MATERNITY</th>
                            <th colSpan={2} className="yellow-bg">MATERNITY</th>
                            <th rowSpan={2}>TPR</th>
                            <th rowSpan={2}>CBHI</th>
                            <th rowSpan={2}>CREDIT</th>
                            <th rowSpan={2}>ADVANCE</th>
                            <th rowSpan={2}>NET SALARY</th>
                        </tr>
                        <tr>
                            <th>6%</th>
                            <th>0.3%</th>
                            <th className="yellow-bg">6%</th>
                            <th className="yellow-bg">O.H 2%</th>
                            <th>0.3%</th>
                            <th>Y:o.3%</th>
                            <th className="yellow-bg">0.3%</th>
                            <th className="yellow-bg">Y:o.3%</th>
                        </tr>
                    </thead>
                    <tbody>
                        {entries.map((entry, index) => {
                            const transport = entry.allowances_breakdown?.['Transport'] || 0;
                            const pensionEmployee = entry.deductions_breakdown?.['Pension Contribution'] || (entry.basic_salary * 0.06);
                            const maternityEmployee = entry.deductions_breakdown?.['Maternity Contribution'] || (entry.basic_salary * 0.003);
                            const pensionEmployer = entry.employer_contributions_breakdown?.['PENSION 6%'] || entry.employer_contributions_breakdown?.['Employer Pension'] || (entry.basic_salary * 0.06);
                            const ohEmployer = entry.employer_contributions_breakdown?.['O.H 2%'] || (entry.basic_salary * 0.02);
                            const maternityEmployer = entry.employer_contributions_breakdown?.['MATERNITY 0.3%'] || entry.employer_contributions_breakdown?.['Employer Maternity'] || (entry.basic_salary * 0.003);
                            const tpr = entry.deductions_breakdown?.['TPR'] || 0;
                            const cbhi = entry.deductions_breakdown?.['CBHI'] || 0;

                            return (
                                <tr key={index}>
                                    <td className="text-center">{index + 1}</td>
                                    <td>{entry.employee.user.name}</td>
                                    <td>{entry.employee.designation?.designation_name || '-'}</td>
                                    <td className="text-right">{formatCurrency(entry.basic_salary)}</td>
                                    <td className="text-right">{formatCurrency(transport)}</td>
                                    <td className="text-right">{formatCurrency(entry.gross_pay)}</td>
                                    <td className="text-right">{formatCurrency(pensionEmployee)}</td>
                                    <td className="text-right">{formatCurrency(maternityEmployee)}</td>
                                    <td className="text-right yellow-bg">{formatCurrency(pensionEmployer)}</td>
                                    <td className="text-right yellow-bg">{formatCurrency(ohEmployer)}</td>
                                    <td className="text-right">{formatCurrency(maternityEmployee)}</td>
                                    <td className="text-right">{formatCurrency(maternityEmployee)}</td>
                                    <td className="text-right yellow-bg">{formatCurrency(maternityEmployer)}</td>
                                    <td className="text-right yellow-bg">{formatCurrency(maternityEmployer)}</td>
                                    <td className="text-right">{formatCurrency(tpr)}</td>
                                    <td className="text-right">{formatCurrency(cbhi)}</td>
                                    <td className="text-right">-</td>
                                    <td className="text-right">-</td>
                                    <td className="text-right">{formatCurrency(entry.net_pay)}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </>
    );
}
