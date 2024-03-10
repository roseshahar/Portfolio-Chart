import React, { useEffect, useState } from "react";
import "./App.css";
import { Line } from "react-chartjs-2";
import { CategoryScale, Chart as ChartJS } from "chart.js/auto";
import moment from "moment";
import Button from "react-bootstrap/Button";

ChartJS.register(CategoryScale);

export const options = {
  responsive: true,
  interaction: {
    mode: "index",
    intersect: false
  },
  stacked: false,
  plugins: {
    title: {
      display: true,
      text: "Chart.js Line Chart - Multi Axis"
    },
    tooltip: {
      callbacks: {
        label: function(context) {
          let label = context.dataset.label || "";

          if (label) {
            label += ": ";
          }
          if (context.parsed.y !== null) {
            label += new Intl.NumberFormat("en-US", {
              style: "percent",
              minimumFractionDigits: 2,
              maximumFractionDigits: 2
            }).format(context.parsed.y);
          }
          return label;
        }
      }
    }
  },
  scales: {
    y: {
      type: "linear",
      display: true,
      position: "left"
    }
  }
};

function App() {
  const [dataReady, setDataReady] = useState(false);
  const [etfData, setEtfData] = useState({});
  const [graphData, setGraphData] = useState({});
  const [historicMonthCount, setHistoricMonthCount] = useState(1);


  async function fetch_etf(etf) {
    const today = moment(Date.now()).format("YYYY-MM-DD");

    let start_date = new Date();
    start_date.setMonth(start_date.getMonth() - historicMonthCount);
    start_date = moment(start_date).format("YYYY-MM-DD");
    console.log("start_date", start_date, historicMonthCount);

    const response = await fetch(`https://www.funder.co.il/wsStock.asmx/GetEtfTickerm?callback=&id=${etf}&startDate=${start_date}&endDate=${today}`);
    const etf_data = await response.json();

    etfData[etf] = etf_data["x"];
  }

  let requestData = async () => {
    let etfs = [1159094, 1159250, 1146646];
    await Promise.all(etfs.map(etf => fetch_etf(etf)));


    let data_sets = [];
    let labels = [];

    for (let key in etfData) {
      let curr_data = etfData[key];
      let base = curr_data[0].p;

      data_sets.push(
        {
          label: key,
          fill: true,
          data: curr_data.map(item => (item.p / base) - 1)
        }
      );
      labels = curr_data.map(item => item.c);
    }

    console.log(etfData);
    console.log(labels);

    setGraphData({
      labels: labels,
      datasets: data_sets
    });
    setDataReady(true);
  };

  useEffect(() => {
    requestData().then();
  }, []);

  if (!dataReady) {
    return <div>Loading...</div>;
  }

  return (
    <div className="App">
      <h1>hello</h1>
      <div>
        <Button variant="secondary"
                onClick={() => {
                  setDataReady(false);
                  setHistoricMonthCount(1);
                  requestData().then(r => {
                  });
                }}>1 Month</Button>
        <Button variant="secondary"
                onClick={() => {
                  setDataReady(false);
                  setHistoricMonthCount(2);
                  requestData().then(r => {
                  });
                }}>3 Months</Button>
        <Button variant="secondary"
                onClick={() => {
                  setDataReady(false);
                  setHistoricMonthCount(3);
                  requestData().then(r => {
                  });
                }}>6 Months</Button>
      </div>
      <header className="App-header">
        <Line options={options} data={graphData} redraw={true} />;
      </header>
    </div>
  );
}

export default App;
