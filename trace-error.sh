#!/bin/bash

echo "=== CHECKING LAST 200 LINES OF LARAVEL LOG ==="
tail -200 storage/logs/laravel.log | grep -B 5 "production.ERROR\|production.CRITICAL" | tail -50

echo ""
echo "=== CHECKING FOR SPECIFIC ERROR TYPES ==="
tail -200 storage/logs/laravel.log | grep -A 10 "Call to undefined\|Class.*not found\|Undefined variable\|syntax error\|SQLSTATE"

echo ""
echo "=== LAST 30 LINES OF LOG ==="
tail -30 storage/logs/laravel.log
