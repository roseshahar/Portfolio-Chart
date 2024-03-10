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
  const [etfData] = useState({});
  const [graphData, setGraphData] = useState({});
  const [historicMonthCount, setHistoricMonthCount] = useState(1);


  async function fetch_etf(etf) {
    console.log("historicMonthCount", historicMonthCount);
    const today = moment(Date.now()).format("YYYY-MM-DD");

    let start_date = new Date();
    start_date.setMonth(start_date.getMonth() - historicMonthCount);
    start_date = moment(start_date).format("YYYY-MM-DD");

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

    setGraphData({
      labels: labels,
      datasets: data_sets
    });
    console.log("requestData", graphData.labels);
    setDataReady(true);
  };

  useEffect(() => {
    requestData().then();
  }, []);

  useEffect(() => {
    // state set is async, we need the hook to handel change in `handleMonthButtons`
    requestData().then();
  }, [historicMonthCount]);

  function handleMonthButtons(event) {
    let month_value = event.target.value;
    setDataReady(false);
    setHistoricMonthCount(month_value);
  }

  if (!dataReady) {
    return <div>Loading...</div>;
  }

  return (
    <div className="App">
      <React.StrictMode>
        <h1>hello</h1>
        <div>
          <Button variant="secondary"
                  value={1}
                  onClick={e => {
                    handleMonthButtons(e);
                  }}>1 Month</Button>
          <Button variant="secondary"
                  value={3}
                  onClick={e => {
                    handleMonthButtons(e);
                  }}>3 Months</Button>
          <Button variant="secondary"
                  value={6}
                  onClick={e => {
                    handleMonthButtons(e);
                  }}>6 Months</Button>
        </div>
        <header className="App-header">
          <Line options={options} data={graphData} />;
        </header>
      </React.StrictMode>,
    </div>
  );
}

export default App;
