// API Configuration
const API_URL = "http://localhost:8000/api/data/getAll";
let allData = [];
let filteredData = [];
const itemsPerPage = 10;
let currentPage = 1;

// Chart instances
let provinceChart;
let growthChart;
let populationDistributionChart;

// DOM Elements
const tableBody = document.getElementById('tableBody');
const provinceFilter = document.getElementById('provinceFilter');
const populationRange = document.getElementById('populationRange');
const changeRateRange = document.getElementById('changeRateRange');
const applyFiltersBtn = document.getElementById('applyFilters');
const resetFiltersBtn = document.getElementById('resetFilters');
const generateReportBtn = document.getElementById('generateReport');
const exportDataBtn = document.getElementById('exportData');
const reportType = document.getElementById('reportType');
const showingCount = document.getElementById('showingCount');
const totalCount = document.getElementById('totalCount');
const pagination = document.getElementById('pagination');
const minPopulation = document.getElementById('minPopulation');
const maxPopulation = document.getElementById('maxPopulation');
const minChangeRate = document.getElementById('minChangeRate');
const maxChangeRate = document.getElementById('maxChangeRate');

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    fetchData();
    
    // Event listeners
    applyFiltersBtn.addEventListener('click', applyFilters);
    resetFiltersBtn.addEventListener('click', resetFilters);
    generateReportBtn.addEventListener('click', generatePDFReport);
    exportDataBtn.addEventListener('click', exportDataToCSV);
    
    // Initialize range displays
    updateRangeDisplays();
    
    populationRange.addEventListener('input', function() {
        minPopulation.textContent = formatNumber(this.value);
    });
    
    changeRateRange.addEventListener('input', function() {
        minChangeRate.textContent = `${this.value}%`;
    });
});

// Fetch data from API
async function fetchData() {
    try {
        showLoading(true);
        const response = await fetch(API_URL);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        allData = await response.json();
        
        // Process data - ensure numbers are properly formatted
        allData = allData.map(item => ({
            ...item,
            Population_2017_Census: Number(item.Population_2017_Census),
            Population_1998_Census: Number(item.Population_1998_Census),
            Change: Number(item.Change)
        }));
        
        filteredData = [...allData];
        initializeFilters();
        renderTable();
        updateCharts();
        showLoading(false);
    } catch (error) {
        console.error('Error fetching data:', error);
        showLoading(false);
        alert('Failed to load data. Please try again later.');
    }
}

// Initialize filters
function initializeFilters() {
    // Get unique provinces
    const provinces = [...new Set(allData.map(item => item.Province))];
    
    // Clear and populate province filter
    provinceFilter.innerHTML = '<option value="">All Provinces</option>';
    provinces.forEach(province => {
        const option = document.createElement('option');
        option.value = province;
        option.textContent = province;
        provinceFilter.appendChild(option);
    });
    
    // Set population range max value
    const maxPopulationValue = Math.max(...allData.map(item => item.Population_2017_Census));
    populationRange.max = Math.ceil(maxPopulationValue / 100000) * 100000;
    populationRange.value = populationRange.max;
    maxPopulation.textContent = formatNumber(populationRange.max);
    
    // Set change rate range max value
    const maxChangeRate = Math.max(...allData.map(item => item.Change));
    changeRateRange.max = Math.ceil(maxChangeRate / 10) * 10;
    changeRateRange.value = changeRateRange.max;
    maxChangeRate.textContent = `${changeRateRange.max}%`;
}

// Apply filters
function applyFilters() {
    const selectedProvince = provinceFilter.value;
    const populationThreshold = parseInt(populationRange.value);
    const changeRateThreshold = parseInt(changeRateRange.value);
    
    filteredData = allData.filter(item => {
        const provinceMatch = selectedProvince === "" || item.Province === selectedProvince;
        const populationMatch = item.Population_2017_Census <= populationThreshold;
        const changeRateMatch = item.Change <= changeRateThreshold;
        return provinceMatch && populationMatch && changeRateMatch;
    });
    
    currentPage = 1;
    renderTable();
    updateCharts();
}

// Reset filters
function resetFilters() {
    provinceFilter.value = "";
    populationRange.value = populationRange.max;
    changeRateRange.value = changeRateRange.max;
    updateRangeDisplays();
    filteredData = [...allData];
    currentPage = 1;
    renderTable();
    updateCharts();
}

// Update range displays
function updateRangeDisplays() {
    minPopulation.textContent = formatNumber(populationRange.min);
    maxPopulation.textContent = formatNumber(populationRange.max);
    minChangeRate.textContent = `${changeRateRange.min}%`;
    maxChangeRate.textContent = `${changeRateRange.max}%`;
}

// Render data table
function renderTable() {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedData = filteredData.slice(startIndex, endIndex);
    
    tableBody.innerHTML = "";
    
    if (paginatedData.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="6" class="text-center">No data found</td></tr>`;
    } else {
        paginatedData.forEach(item => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${item.Rank}</td>
                <td>${item.City}</td>
                <td>${item.Province}</td>
                <td>${formatNumber(item.Population_2017_Census)}</td>
                <td>${formatNumber(item.Population_1998_Census)}</td>
                <td class="${getChangeRateClass(item.Change)}">${item.Change}%</td>
            `;
            tableBody.appendChild(row);
        });
    }
    
    // Update counts
    showingCount.textContent = `${startIndex + 1}-${Math.min(endIndex, filteredData.length)}`;
    totalCount.textContent = filteredData.length;
    
    // Render pagination
    renderPagination();
}

// Render pagination
function renderPagination() {
    const totalPages = Math.ceil(filteredData.length / itemsPerPage);
    
    pagination.innerHTML = "";
    
    if (totalPages <= 1) return;
    
    // Previous button
    const prevLi = document.createElement('li');
    prevLi.className = `page-item ${currentPage === 1 ? 'disabled' : ''}`;
    prevLi.innerHTML = `<a class="page-link" href="#" aria-label="Previous"><span aria-hidden="true">&laquo;</span></a>`;
    prevLi.addEventListener('click', (e) => {
        e.preventDefault();
        if (currentPage > 1) {
            currentPage--;
            renderTable();
        }
    });
    pagination.appendChild(prevLi);
    
    // Page numbers
    for (let i = 1; i <= totalPages; i++) {
        const li = document.createElement('li');
        li.className = `page-item ${i === currentPage ? 'active' : ''}`;
        li.innerHTML = `<a class="page-link" href="#">${i}</a>`;
        li.addEventListener('click', (e) => {
            e.preventDefault();
            currentPage = i;
            renderTable();
        });
        pagination.appendChild(li);
    }
    
    // Next button
    const nextLi = document.createElement('li');
    nextLi.className = `page-item ${currentPage === totalPages ? 'disabled' : ''}`;
    nextLi.innerHTML = `<a class="page-link" href="#" aria-label="Next"><span aria-hidden="true">&raquo;</span></a>`;
    nextLi.addEventListener('click', (e) => {
        e.preventDefault();
        if (currentPage < totalPages) {
            currentPage++;
            renderTable();
        }
    });
    pagination.appendChild(nextLi);
}

// Update charts
function updateCharts() {
    updateProvinceChart();
    updateGrowthChart();
    updatePopulationDistributionChart();
}

// Update province chart
function updateProvinceChart() {
    const ctx = document.getElementById('provinceChart').getContext('2d');
    
    // Group by province and sum population
    const provinceData = {};
    filteredData.forEach(item => {
        if (!provinceData[item.Province]) {
            provinceData[item.Province] = 0;
        }
        provinceData[item.Province] += item.Population_2017_Census;
    });
    
    const provinces = Object.keys(provinceData);
    const populations = Object.values(provinceData);
    
    if (provinceChart) {
        provinceChart.destroy();
    }
    
    provinceChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: provinces,
            datasets: [{
                label: 'Population (2017 Census)',
                data: populations,
                backgroundColor: [
                    'rgba(255, 99, 132, 0.7)',
                    'rgba(54, 162, 235, 0.7)',
                    'rgba(255, 206, 86, 0.7)',
                    'rgba(75, 192, 192, 0.7)',
                    'rgba(153, 102, 255, 0.7)',
                    'rgba(255, 159, 64, 0.7)'
                ],
                borderColor: [
                    'rgba(255, 99, 132, 1)',
                    'rgba(54, 162, 235, 1)',
                    'rgba(255, 206, 86, 1)',
                    'rgba(75, 192, 192, 1)',
                    'rgba(153, 102, 255, 1)',
                    'rgba(255, 159, 64, 1)'
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `Population: ${formatNumber(context.raw)}`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return formatNumber(value);
                        }
                    }
                }
            }
        }
    });
}

// Update growth chart
function updateGrowthChart() {
    const ctx = document.getElementById('growthChart').getContext('2d');
    
    // Sort by change rate and take top 10
    const sortedData = [...filteredData].sort((a, b) => b.Change - a.Change).slice(0, 10);
    
    const cities = sortedData.map(item => item.City);
    const changeRates = sortedData.map(item => item.Change);
    
    if (growthChart) {
        growthChart.destroy();
    }
    
    growthChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: cities,
            datasets: [{
                label: 'Population Change Rate (%)',
                data: changeRates,
                backgroundColor: 'rgba(54, 162, 235, 0.7)',
                borderColor: 'rgba(54, 162, 235, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return `${value}%`;
                        }
                    }
                }
            }
        }
    });
}

// Update population distribution chart
function updatePopulationDistributionChart() {
    const ctx = document.getElementById('populationDistributionChart').getContext('2d');
    
    // Sort by population and take top 15
    const sortedData = [...filteredData].sort((a, b) => b.Population_2017_Census - a.Population_2017_Census).slice(0, 15);
    
    const cities = sortedData.map(item => item.City);
    const populations2017 = sortedData.map(item => item.Population_2017_Census);
    const populations1998 = sortedData.map(item => item.Population_1998_Census);
    
    if (populationDistributionChart) {
        populationDistributionChart.destroy();
    }
    
    populationDistributionChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: cities,
            datasets: [
                {
                    label: 'Population (2017 Census)',
                    data: populations2017,
                    backgroundColor: 'rgba(255, 99, 132, 0.2)',
                    borderColor: 'rgba(255, 99, 132, 1)',
                    borderWidth: 2,
                    tension: 0.1,
                    fill: true
                },
                {
                    label: 'Population (1998 Census)',
                    data: populations1998,
                    backgroundColor: 'rgba(54, 162, 235, 0.2)',
                    borderColor: 'rgba(54, 162, 235, 1)',
                    borderWidth: 2,
                    tension: 0.1,
                    fill: true
                }
            ]
        },
        options: {
            responsive: true,
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `${context.dataset.label}: ${formatNumber(context.raw)}`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return formatNumber(value);
                        }
                    }
                }
            }
        }
    });
}

// Generate PDF report
async function generatePDFReport() {
    try {
        showLoading(true);
        
        // Create a new PDF document
        const { PDFDocument, rgb } = PDFLib;
        const pdfDoc = await PDFDocument.create();
        
        // Add a new page
        const page = pdfDoc.addPage([600, 800]);
        
        // Set font
        const font = await pdfDoc.embedFont(PDFLib.StandardFonts.Helvetica);
        const fontBold = await pdfDoc.embedFont(PDFLib.StandardFonts.HelveticaBold);
        
        // Add title
        page.drawText('Pakistan City Population Report', {
            x: 50,
            y: 750,
            size: 20,
            font: fontBold,
            color: rgb(0, 0, 0)
        });
        
        // Add report type
        page.drawText(`Report Type: ${reportType.options[reportType.selectedIndex].text}`, {
            x: 50,
            y: 720,
            size: 14,
            font: font,
            color: rgb(0, 0, 0)
        });
        
        // Add date
        const today = new Date();
        page.drawText(`Generated on: ${today.toLocaleDateString()}`, {
            x: 50,
            y: 700,
            size: 12,
            font: font,
            color: rgb(0, 0, 0)
        });
        
        // Prepare data based on report type
        let reportData = [];
        let reportTitle = "";
        
        switch(reportType.value) {
            case 'top10':
                reportData = [...filteredData].sort((a, b) => b.Population_2017_Census - a.Population_2017_Census).slice(0, 10);
                reportTitle = "Top 10 Cities by Population (2017 Census)";
                break;
            case 'bottom10':
                reportData = [...filteredData].sort((a, b) => a.Population_2017_Census - b.Population_2017_Census).slice(0, 10);
                reportTitle = "Bottom 10 Cities by Population (2017 Census)";
                break;
            case 'highestGrowth':
                reportData = [...filteredData].sort((a, b) => b.Change - a.Change).slice(0, 10);
                reportTitle = "Top 10 Cities by Population Growth Rate";
                break;
            case 'lowestGrowth':
                reportData = [...filteredData].sort((a, b) => a.Change - b.Change).slice(0, 10);
                reportTitle = "Bottom 10 Cities by Population Growth Rate";
                break;
            case 'provinceSummary':
                // Group by province
                const provinceSummary = {};
                filteredData.forEach(item => {
                    if (!provinceSummary[item.Province]) {
                        provinceSummary[item.Province] = {
                            count: 0,
                            totalPopulation2017: 0,
                            totalPopulation1998: 0,
                            avgChangeRate: 0
                        };
                    }
                    provinceSummary[item.Province].count++;
                    provinceSummary[item.Province].totalPopulation2017 += item.Population_2017_Census;
                    provinceSummary[item.Province].totalPopulation1998 += item.Population_1998_Census;
                });
                
                // Calculate average change rate
                Object.keys(provinceSummary).forEach(province => {
                    provinceSummary[province].avgChangeRate = 
                        ((provinceSummary[province].totalPopulation2017 - provinceSummary[province].totalPopulation1998) / 
                        provinceSummary[province].totalPopulation1998) * 100;
                });
                
                reportData = Object.keys(provinceSummary).map(province => ({
                    City: province,
                    Province: "",
                    Population_2017_Census: provinceSummary[province].totalPopulation2017,
                    Population_1998_Census: provinceSummary[province].totalPopulation1998,
                    Change: provinceSummary[province].avgChangeRate,
                    Rank: provinceSummary[province].count
                }));
                
                reportTitle = "Province Summary";
                break;
        }
        
        // Add report title
        page.drawText(reportTitle, {
            x: 50,
            y: 670,
            size: 16,
            font: fontBold,
            color: rgb(0, 0, 0)
        });
        
        // Add table headers
        const headers = ["Rank", "City", "Province", "Pop. 2017", "Pop. 1998", "Change %"];
        const headerY = 640;
        const colWidths = [50, 150, 100, 100, 100, 80];
        const colXs = [50, 100, 250, 350, 450, 550];
        
        headers.forEach((header, i) => {
            page.drawText(header, {
                x: colXs[i],
                y: headerY,
                size: 12,
                font: fontBold,
                color: rgb(0, 0, 0)
            });
        });
        
        // Add table data
        let y = headerY - 20;
        reportData.forEach((item, index) => {
            if (y < 50) {
                // Add a new page if we're running out of space
                y = 750;
                const newPage = pdfDoc.addPage([600, 800]);
                newPage.drawText(reportTitle, {
                    x: 50,
                    y: 770,
                    size: 16,
                    font: fontBold,
                    color: rgb(0, 0, 0)
                });
                
                // Add headers on new page
                headers.forEach((header, i) => {
                    newPage.drawText(header, {
                        x: colXs[i],
                        y: 740,
                        size: 12,
                        font: fontBold,
                        color: rgb(0, 0, 0)
                    });
                });
                
                y = 720;
            }
            
            const rowData = [
                item.Rank.toString(),
                item.City,
                item.Province,
                formatNumber(item.Population_2017_Census),
                formatNumber(item.Population_1998_Census),
                item.Change.toFixed(1) + "%"
            ];
            
            rowData.forEach((text, i) => {
                page.drawText(text, {
                    x: colXs[i],
                    y: y,
                    size: 10,
                    font: font,
                    color: rgb(0, 0, 0),
                    maxWidth: colWidths[i]
                });
            });
            
            y -= 20;
        });
        
        // Save the PDF
        const pdfBytes = await pdfDoc.save();
        const blob = new Blob([pdfBytes], { type: 'application/pdf' });
        saveAs(blob, `Pakistan_Population_Report_${reportType.value}_${today.getTime()}.pdf`);
        
        showLoading(false);
    } catch (error) {
        console.error('Error generating PDF:', error);
        showLoading(false);
        alert('Failed to generate PDF report. Please try again.');
    }
}

// Export data to CSV
function exportDataToCSV() {
    let csvContent = "Rank,City,Province,Population (2017 Census),Population (1998 Census),Change Rate (%)\n";
    
    filteredData.forEach(item => {
        csvContent += `${item.Rank},"${item.City}","${item.Province}",${item.Population_2017_Census},${item.Population_1998_Census},${item.Change}\n`;
    });
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const today = new Date();
    saveAs(blob, `Pakistan_Population_Data_${today.getTime()}.csv`);
}

// Helper function to format numbers with commas
function formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

// Helper function to get CSS class for change rate
function getChangeRateClass(rate) {
    if (rate > 0) return 'text-success';
    if (rate < 0) return 'text-danger';
    return '';
}

// Show/hide loading indicator
function showLoading(show) {
    const loadingElement = document.querySelector('.loading-spinner');
    if (show) {
        if (!loadingElement) {
            const spinner = document.createElement('div');
            spinner.className = 'loading-spinner active';
            spinner.innerHTML = `
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Loading...</span>
                </div>
                <p class="mt-2">Loading data, please wait...</p>
            `;
            document.body.appendChild(spinner);
        } else {
            loadingElement.classList.add('active');
        }
    } else {
        if (loadingElement) {
            loadingElement.classList.remove('active');
        }
    }
}