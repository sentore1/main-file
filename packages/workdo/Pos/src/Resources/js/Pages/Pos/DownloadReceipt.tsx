import html2pdf from 'html2pdf.js';
import { formatDate } from '@/utils/helpers';

export const downloadReceiptPDF = async (completedSale: any, globalSettings: any, logoBase64?: string) => {
    console.log('Download PDF called with logo:', logoBase64 ? 'Yes' : 'No');
    console.log('Global Settings:', globalSettings);
    
    // Get currency settings from globalSettings
    const currencySymbol = globalSettings?.currencySymbol || globalSettings?.currency_symbol || '$';
    const decimalPlaces = parseInt(globalSettings?.decimalFormat || globalSettings?.decimal_format || '2');
    const decimalSeparator = globalSettings?.decimalSeparator || globalSettings?.decimal_separator || '.';
    const thousandsSeparator = globalSettings?.thousandsSeparator || globalSettings?.thousands_separator || ',';
    const currencySymbolPosition = globalSettings?.currencySymbolPosition || globalSettings?.currency_symbol_position || 'before';
    const currencySymbolSpace = globalSettings?.currencySymbolSpace === '1' || globalSettings?.currency_symbol_space === '1';
    
    // Format currency function
    const formatCurrency = (amount: number) => {
        const parts = Number(amount).toFixed(decimalPlaces).split('.');
        if (thousandsSeparator !== 'none') {
            parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, thousandsSeparator);
        }
        const formattedNumber = parts.join(decimalSeparator);
        const space = currencySymbolSpace ? ' ' : '';
        return currencySymbolPosition === 'before'
            ? `${currencySymbol}${space}${formattedNumber}`
            : `${formattedNumber}${space}${currencySymbol}`;
    };
    
    const receiptHTML = `
        <div class="receipt">
            <div class="header">
                ${logoBase64 ? `
                    <img src="${logoBase64}" alt="Logo" style="max-height: 40px; width: auto; margin: 0 auto 10px; display: block;" />
                ` : `
                    <div class="company-name">${globalSettings?.company_name || 'COMPANY NAME'}</div>
                `}
                <div class="company-info">
                    ${globalSettings?.company_address || 'Company Address'}<br>
                    ${globalSettings?.company_city || 'City'}<br>
                    ${globalSettings?.company_country || 'Country'} - ${globalSettings?.company_zipcode || 'Zipcode'}
                </div>
            </div>
            
            <div class="separator"></div>
            
            <div class="receipt-info">
                <div class="info-row">
                    <span>Receipt No:</span>
                    <span>${completedSale.pos_number}</span>
                </div>
                <div class="info-row">
                    <span>Date:</span>
                    <span>${formatDate(new Date())}</span>
                </div>
                <div class="info-row">
                    <span>Time:</span>
                    <span>${new Date().toLocaleTimeString()}</span>
                </div>
                <div class="info-row">
                    <span>Customer:</span>
                    <span>${completedSale.customer?.name || 'Walk-in Customer'}</span>
                </div>
                ${completedSale.waiter_name ? `
                <div class="info-row">
                    <span>Waiter:</span>
                    <span>${completedSale.waiter_name}</span>
                </div>
                ` : ''}
            </div>
            
            <div class="separator"></div>
            
            <div class="items-section">
                ${completedSale.items.map((item: any) => {
                    const itemSubtotal = item.price * item.quantity;
                    let itemTaxAmount = 0;
                    let taxDisplay = '';
                    if (item.taxes && item.taxes.length > 0) {
                        const taxNames = item.taxes.map((tax: any) => {
                            itemTaxAmount += (itemSubtotal * tax.rate) / 100;
                            return `${tax.name} (${tax.rate}%)`;
                        });
                        taxDisplay = taxNames.join(', ');
                    } else {
                        taxDisplay = '-';
                    }
                    return `
                        <div class="item">
                            <div class="item-name">${item.name}</div>
                            ${item.notes ? `<div class="item-notes" style="font-size: 11px; color: #2563eb; font-style: italic; margin-bottom: 5px;">📝 ${item.notes}</div>` : ''}
                            ${item.is_room && item.includes_breakfast ? `<div class="item-breakfast" style="font-size: 11px; color: #ea580c; font-weight: 600; margin-bottom: 5px;">☕ Includes Breakfast</div>` : ''}
                            <div class="item-details">
                                <div class="total-row">
                                    <span>Qty:</span>
                                    <span>${item.quantity}</span>
                                </div>
                                <div class="total-row">
                                    <span>Price:</span>
                                    <span>${formatCurrency(item.price)}</span>
                                </div>
                                <div class="total-row">
                                    <span>Tax:</span>
                                    <span>${taxDisplay}</span>
                                </div>
                                <div class="total-row">
                                    <span>Tax Amount:</span>
                                    <span>${formatCurrency(itemTaxAmount)}</span>
                                </div>
                                <div class="total-row" style="font-weight: bold; border-top: 1px dotted #ccc; padding-top: 5px; margin-top: 5px;">
                                    <span>Sub Total:</span>
                                    <span>${formatCurrency(itemSubtotal + itemTaxAmount)}</span>
                                </div>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
            
            <div class="separator"></div>
            
            <div class="totals">
                <div class="total-row">
                    <span>Discount:</span>
                    <span>-${formatCurrency(completedSale.discount || 0)}</span>
                </div>
                <div class="final-total">
                    <span>TOTAL:</span>
                    <span>${formatCurrency(completedSale.total)}</span>
                </div>
                ${(completedSale.balance_due !== undefined && completedSale.balance_due > 0) ? `
                    <div class="separator-thin"></div>
                    <div class="total-row" style="color: #16a34a; font-weight: 600;">
                        <span>Paid:</span>
                        <span>${formatCurrency(completedSale.paid_amount || 0)}</span>
                    </div>
                    <div class="total-row" style="color: #ea580c; font-weight: 700;">
                        <span>Balance Due:</span>
                        <span>${formatCurrency(completedSale.balance_due)}</span>
                    </div>
                ` : ''}
            </div>
            
            <div class="separator"></div>
            
            <div class="footer">
                <div style="font-weight: bold;">★ THANK YOU ★</div>
                <div>Visit Again!</div>
            </div>
        </div>
        
        <style>
            .receipt { max-width: 400px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif; }
            .header { text-align: center; margin-bottom: 20px; }
            .company-name { font-size: 20px; font-weight: bold; margin-bottom: 10px; }
            .company-info { font-size: 12px; line-height: 1.4; }
            .separator { border-top: 2px dashed #000; margin: 15px 0; }
            .separator-thin { border-top: 1px solid #ccc; margin: 10px 0; }
            .info-row { display: flex; justify-content: space-between; margin-bottom: 5px; font-size: 12px; }
            .item { margin-bottom: 15px; padding-bottom: 10px; border-bottom: 1px dotted #ccc; }
            .item-name { font-weight: bold; margin-bottom: 8px; font-size: 14px; }
            .item-details { font-size: 12px; }
            .total-row { display: flex; justify-content: space-between; margin-bottom: 5px; }
            .final-total { display: flex; justify-content: space-between; font-weight: bold; font-size: 16px; border-top: 2px solid #000; padding-top: 10px; margin-top: 10px; }
            .footer { text-align: center; margin-top: 20px; font-size: 12px; }
        </style>
    `;
    
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = receiptHTML;
    document.body.appendChild(tempDiv);
    
    const opt = {
        margin: 0.1,
        filename: `receipt-${completedSale.pos_number}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'mm', format: [80, 297], orientation: 'portrait' }
    };
    
    try {
        await html2pdf().set(opt).from(tempDiv).save();
    } catch (error) {
        console.error('PDF generation failed:', error);
    } finally {
        document.body.removeChild(tempDiv);
    }
};
