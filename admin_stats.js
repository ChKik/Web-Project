document.addEventListener('DOMContentLoaded', () => {
    const ctx = document.getElementById('statsChart').getContext('2d');
    let chartInstance = null;

    function fetchData(timePeriod) {
        return fetch(`http://localhost:3000/api/getStats?timePeriod=${timePeriod}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok ' + response.statusText);
                }
                return response.json();
            })
            .then(data => {
                // Log the data to inspect
                console.log('Received stats data:', data);

                return data;
            })
            .catch(error => {
                console.error('Error fetching stats data:', error.message);
                return null;
            });
    }

    function updateGraph() {
        const timePeriod = document.getElementById('time-period').value;

        fetchData(timePeriod).then(data => {
            if (!data) return;

            // Destroy the existing chart instance if it exists
            if (chartInstance) {
                chartInstance.destroy();
            }

            // Create a new chart with the fetched data
            chartInstance = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: ['New Requests', 'New Offers', 'Processed Requests', 'Processed Offers'],
                    datasets: [{
                        label: 'Count',
                        data: [
                            data.newRequests,
                            data.newOffers,
                            data.processedRequests,
                            data.processedOffers
                        ],
                        backgroundColor: [
                            'rgba(75, 192, 192, 0.2)',
                            'rgba(54, 162, 235, 0.2)',
                            'rgba(255, 206, 86, 0.2)',
                            'rgba(153, 102, 255, 0.2)'
                        ],
                        borderColor: [
                            'rgba(75, 192, 192, 1)',
                            'rgba(54, 162, 235, 1)',
                            'rgba(255, 206, 86, 1)',
                            'rgba(153, 102, 255, 1)'
                        ],
                        borderWidth: 1
                    }]
                },
                options: {
                    scales: {
                        y: {
                            beginAtZero: true
                        }
                    }
                }
            });
        });
    }

    // Initial graph load for default time period
    updateGraph();

    // Attach the updateGraph function to the time period select element
    document.getElementById('time-period').addEventListener('change', updateGraph);
});


// document.addEventListener('DOMContentLoaded', () => {   //prwto
//     const ctx = document.getElementById('statsChart').getContext('2d');

//     fetch('http://localhost:3000/api/getStats')
//         .then(response => {
//             if (!response.ok) {
//                 throw new Error('Network response was not ok ' + response.statusText);
//             }
//             return response.json();
//         })
//         .then(data => {
//             console.log('Received stats data:', data); // Log the data to inspect

//             // Validate the structure of data    //caused error
//             // if (
//             //     typeof data.newRequests !== 'number' ||
//             //     typeof data.newOffers !== 'number' ||
//             //     typeof data.processedRequests !== 'number' ||
//             //     typeof data.processedOffers !== 'number'
//             // ) {
//             //     throw new Error('Invalid data format');
//             // }

//             // Create the chart with the fetched data
//             new Chart(ctx, {
//                 type: 'bar',
//                 data: {
//                     labels: ['New Requests', 'New Offers', 'Processed Requests', 'Processed Offers'],
//                     datasets: [{
//                         label: 'Count',
//                         data: [
//                             data.newRequests,
//                             data.newOffers,
//                             data.processedRequests,
//                             data.processedOffers
//                         ],
//                         backgroundColor: [
//                             'rgba(75, 192, 192, 0.2)',
//                             'rgba(54, 162, 235, 0.2)',
//                             'rgba(255, 206, 86, 0.2)',
//                             'rgba(153, 102, 255, 0.2)'
//                         ],
//                         borderColor: [
//                             'rgba(75, 192, 192, 1)',
//                             'rgba(54, 162, 235, 1)',
//                             'rgba(255, 206, 86, 1)',
//                             'rgba(153, 102, 255, 1)'
//                         ],
//                         borderWidth: 1
//                     }]
//                 },
//                 options: {
//                     scales: {
//                         y: {
//                             beginAtZero: true
//                         }
//                     }
//                 }
//             });
//         })
//         .catch(error => {
//             console.error('Error fetching stats data:', error.message);
//         });
// });
