<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Kitchen Order - {{ $order_number }}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: 'Courier New', monospace;
            font-size: 14px;
            padding: 10px;
            max-width: 300px;
            margin: 0 auto;
        }
        .header {
            text-align: center;
            border-bottom: 2px dashed #000;
            padding-bottom: 10px;
            margin-bottom: 15px;
        }
        .header h1 {
            font-size: 20px;
            font-weight: bold;
            margin-bottom: 5px;
        }
        .header .order-number {
            font-size: 16px;
            font-weight: bold;
        }
        .info {
            margin-bottom: 15px;
            border-bottom: 1px dashed #000;
            padding-bottom: 10px;
        }
        .info-row {
            display: flex;
            justify-content: space-between;
            margin: 3px 0;
        }
        .info-label {
            font-weight: bold;
        }
        .items {
            margin-bottom: 15px;
        }
        .item {
            margin: 10px 0;
            padding: 8px 0;
            border-bottom: 1px solid #ddd;
        }
        .item-header {
            display: flex;
            justify-content: space-between;
            font-weight: bold;
            font-size: 16px;
            margin-bottom: 5px;
        }
        .item-qty {
            font-size: 18px;
            font-weight: bold;
        }
        .item-notes {
            margin-top: 5px;
            padding: 5px;
            background: #f0f0f0;
            font-style: italic;
            font-size: 12px;
        }
        .footer {
            text-align: center;
            margin-top: 20px;
            padding-top: 10px;
            border-top: 2px dashed #000;
            font-size: 12px;
        }
        .buttons {
            text-align: center;
            margin: 20px 0;
        }
        .btn {
            padding: 12px 24px;
            margin: 5px;
            font-size: 16px;
            cursor: pointer;
            border: 2px solid #000;
            background: white;
            font-weight: bold;
        }
        .btn:hover {
            background: #000;
            color: white;
        }
        @media print {
            .buttons {
                display: none;
            }
            body {
                max-width: 100%;
            }
        }
    </style>
</head>
<body>
    <div class="buttons">
        <button class="btn" onclick="window.print()">🖨️ PRINT</button>
        <button class="btn" onclick="window.close()">✖ CLOSE</button>
    </div>

    <div class="header">
        <h1>KITCHEN ORDER</h1>
        <div class="order-number">{{ $order_number }}</div>
    </div>

    <div class="info">
        <div class="info-row">
            <span class="info-label">Date:</span>
            <span>{{ $date }}</span>
        </div>
        <div class="info-row">
            <span class="info-label">Customer:</span>
            <span>{{ $customer ? $customer->name : 'Walk-in' }}</span>
        </div>
        @if($waiter_name)
        <div class="info-row">
            <span class="info-label">Waiter:</span>
            <span>{{ $waiter_name }}</span>
        </div>
        @endif
        <div class="info-row">
            <span class="info-label">Location:</span>
            <span>{{ $warehouse->name ?? 'N/A' }}</span>
        </div>
    </div>

    <div class="items">
        @foreach($items as $item)
        <div class="item">
            <div class="item-header">
                <span class="item-name">{{ $item['product_name'] }}</span>
                <span class="item-qty">x{{ number_format($item['quantity'], 0) }}</span>
            </div>
            @if(!empty($item['notes']))
            <div class="item-notes">
                📝 {{ $item['notes'] }}
            </div>
            @endif
        </div>
        @endforeach
    </div>

    <div class="footer">
        <p><strong>Total Items: {{ count($items) }}</strong></p>
        <p style="margin-top: 10px;">⚠️ This is a kitchen order slip</p>
        <p>Not a payment receipt</p>
    </div>

    <script>
        // Auto-print when page loads (optional)
        // window.onload = function() {
        //     window.print();
        // };
    </script>
</body>
</html>
