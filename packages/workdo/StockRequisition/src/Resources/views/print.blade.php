<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>{{ $requisition->requisition_number }}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: Arial, sans-serif; padding: 40px; color: #333; }
        .header { display: flex; justify-content: space-between; align-items: start; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px; }
        .header-left { flex: 1; max-width: 50%; }
        .header-right { text-align: right; flex: 1; max-width: 50%; }
        .logo { max-width: 150px; max-height: 80px; margin-bottom: 15px; object-fit: contain; display: block; }
        .company-name { font-size: 24px; font-weight: bold; margin-bottom: 5px; }
        .company-info { font-size: 12px; color: #666; line-height: 1.6; }
        .document-title { font-size: 28px; font-weight: bold; margin-bottom: 5px; }
        .document-number { font-size: 16px; color: #666; }
        .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; }
        .info-item { margin-bottom: 15px; }
        .info-label { font-weight: bold; color: #666; font-size: 12px; margin-bottom: 5px; }
        .info-value { font-size: 14px; }
        .status-badge { display: inline-block; padding: 4px 12px; border-radius: 4px; font-size: 12px; font-weight: bold; }
        .status-pending { background: #fef3c7; color: #92400e; }
        .status-approved { background: #dbeafe; color: #1e40af; }
        .status-rejected { background: #fee2e2; color: #991b1b; }
        .status-fulfilled { background: #d1fae5; color: #065f46; }
        .status-draft { background: #f3f4f6; color: #374151; }
        .items-table { width: 100%; border-collapse: collapse; margin-top: 30px; }
        .items-table th { background: #f3f4f6; padding: 12px; text-align: left; border-bottom: 2px solid #333; font-size: 12px; }
        .items-table td { padding: 12px; border-bottom: 1px solid #e5e7eb; font-size: 14px; }
        .items-table tr:last-child td { border-bottom: none; }
        .section-title { font-size: 18px; font-weight: bold; margin: 30px 0 15px; border-bottom: 1px solid #e5e7eb; padding-bottom: 10px; }
        .notes-box { background: #f9fafb; padding: 15px; border-radius: 4px; margin-top: 10px; }
        .footer { margin-top: 50px; text-align: center; color: #666; font-size: 12px; }
        @media print {
            body { padding: 20px; }
            .no-print { display: none; }
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="header-left">
            @if(!empty($logo))
            <img src="{{ $logo }}" alt="Company Logo" class="logo" onerror="this.style.display='none'">
            @endif
            <div class="company-name">{{ $settings['company_name'] ?? config('app.name', 'Company Name') }}</div>
            <div class="company-info">
                @if(!empty($settings['company_address']))
                {{ $settings['company_address'] }}<br>
                @endif
                @if(!empty($settings['company_city']) || !empty($settings['company_state']))
                {{ $settings['company_city'] ?? '' }} {{ $settings['company_state'] ?? '' }} {{ $settings['company_zipcode'] ?? '' }}<br>
                @endif
                @if(!empty($settings['company_telephone']))
                Tel: {{ $settings['company_telephone'] }}<br>
                @endif
                @if(!empty($settings['company_email']))
                Email: {{ $settings['company_email'] }}
                @endif
            </div>
        </div>
        <div class="header-right">
            <div class="document-title">STOCK REQUISITION</div>
            <div class="document-number">{{ $requisition->requisition_number }}</div>
        </div>
    </div>

    <div class="info-grid">
        <div>
            <div class="info-item">
                <div class="info-label">Requisition Date</div>
                <div class="info-value">{{ \Carbon\Carbon::parse($requisition->requisition_date)->format('M d, Y') }}</div>
            </div>
            <div class="info-item">
                <div class="info-label">Required Date</div>
                <div class="info-value">{{ \Carbon\Carbon::parse($requisition->required_date)->format('M d, Y') }}</div>
            </div>
            <div class="info-item">
                <div class="info-label">Requested By</div>
                <div class="info-value">{{ $requisition->requestedBy->name ?? 'N/A' }}</div>
            </div>
        </div>
        <div>
            <div class="info-item">
                <div class="info-label">Status</div>
                <div class="info-value">
                    <span class="status-badge status-{{ $requisition->status }}">
                        {{ strtoupper($requisition->status) }}
                    </span>
                </div>
            </div>
            <div class="info-item">
                <div class="info-label">Warehouse</div>
                <div class="info-value">{{ $requisition->warehouse->name ?? 'N/A' }}</div>
            </div>
            <div class="info-item">
                <div class="info-label">Department</div>
                <div class="info-value">{{ $requisition->department ?: '-' }}</div>
            </div>
        </div>
    </div>

    @if($requisition->purpose)
    <div class="info-item">
        <div class="info-label">Purpose</div>
        <div class="notes-box">{{ $requisition->purpose }}</div>
    </div>
    @endif

    <div class="section-title">Requisition Items</div>
    <table class="items-table">
        <thead>
            <tr>
                <th>#</th>
                <th>Product</th>
                <th>SKU</th>
                <th style="text-align: right;">Requested Qty</th>
                @if($requisition->status !== 'pending' && $requisition->status !== 'draft')
                <th style="text-align: right;">Approved Qty</th>
                @endif
                @if($requisition->status === 'fulfilled')
                <th style="text-align: right;">Fulfilled Qty</th>
                @endif
                <th>Unit</th>
                <th>Notes</th>
            </tr>
        </thead>
        <tbody>
            @foreach($requisition->items as $index => $item)
            <tr>
                <td>{{ $index + 1 }}</td>
                <td>{{ $item->product->name ?? 'N/A' }}</td>
                <td>{{ $item->product->sku ?? '-' }}</td>
                <td style="text-align: right;">{{ number_format($item->quantity_requested, 2) }}</td>
                @if($requisition->status !== 'pending' && $requisition->status !== 'draft')
                <td style="text-align: right;">{{ $item->quantity_approved ? number_format($item->quantity_approved, 2) : '-' }}</td>
                @endif
                @if($requisition->status === 'fulfilled')
                <td style="text-align: right;">{{ $item->quantity_fulfilled ? number_format($item->quantity_fulfilled, 2) : '-' }}</td>
                @endif
                <td>{{ $item->product->unit ?? '-' }}</td>
                <td>{{ $item->notes ?: '-' }}</td>
            </tr>
            @endforeach
        </tbody>
    </table>

    @if($requisition->notes)
    <div class="section-title">Additional Notes</div>
    <div class="notes-box">{{ $requisition->notes }}</div>
    @endif

    @if($requisition->rejection_reason)
    <div class="section-title" style="color: #991b1b;">Rejection Reason</div>
    <div class="notes-box" style="background: #fee2e2; color: #991b1b;">{{ $requisition->rejection_reason }}</div>
    @endif

    @if($requisition->approved_by || $requisition->fulfilled_by)
    <div class="section-title">Approval & Fulfillment</div>
    <div class="info-grid">
        @if($requisition->approved_by)
        <div>
            <div class="info-item">
                <div class="info-label">Approved By</div>
                <div class="info-value">{{ $requisition->approvedBy->name ?? 'N/A' }}</div>
            </div>
            <div class="info-item">
                <div class="info-label">Approved At</div>
                <div class="info-value">{{ $requisition->approved_at ? \Carbon\Carbon::parse($requisition->approved_at)->format('M d, Y H:i') : '-' }}</div>
            </div>
        </div>
        @endif
        @if($requisition->fulfilled_by)
        <div>
            <div class="info-item">
                <div class="info-label">Fulfilled By</div>
                <div class="info-value">{{ $requisition->fulfilledBy->name ?? 'N/A' }}</div>
            </div>
            <div class="info-item">
                <div class="info-label">Fulfilled At</div>
                <div class="info-value">{{ $requisition->fulfilled_at ? \Carbon\Carbon::parse($requisition->fulfilled_at)->format('M d, Y H:i') : '-' }}</div>
            </div>
        </div>
        @endif
    </div>
    @endif

    <div class="footer">
        <p>Generated on {{ now()->format('M d, Y H:i') }}</p>
        <p class="no-print" style="margin-top: 20px;">
            <button onclick="window.print()" style="padding: 10px 20px; background: #3b82f6; color: white; border: none; border-radius: 4px; cursor: pointer;">Print / Save as PDF</button>
        </p>
    </div>

    <script>
        // Auto-trigger print dialog when page loads
        window.onload = function() { 
            window.print(); 
        }
    </script>
</body>
</html>
