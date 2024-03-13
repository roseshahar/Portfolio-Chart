import React, { useEffect, useState } from "react";
import "./App.css";
import { Line } from "react-chartjs-2";
import { CategoryScale, Chart as ChartJS } from "chart.js/auto";
import moment from "moment";
import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";

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
      text: "ETF Comparison (Percentages)"
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
  const [userEtfList, setUserEtfList] = useState([1159250]);

  const etfJsonRef = React.createRef();


  async function fetch_etf(etf) {
    const today = moment(Date.now()).format("YYYY-MM-DD");

    let start_date = new Date();
    start_date.setMonth(start_date.getMonth() - historicMonthCount);
    start_date = moment(start_date).format("YYYY-MM-DD");

    let response = await fetch(`https://www.funder.co.il/wsStock.asmx/GetEtfTickerm?callback=&id=${etf}&startDate=${start_date}&endDate=${today}`);
    let etf_data;
    let etf_name_path;

    try {
      etf_data = await response.json();
      etf_name_path = `seco/${etf}/s`;
    } catch (e) {
      let response = await fetch(`https://www.funder.co.il/wsfund.asmx/GetFundTickerm?callback=&id=${etf}&startDate=${start_date}&endDate=${today}`);
      console.log(etf, etf_data)

      etf_data = await response.json();
      etf_name_path = `fundo/${etf}`;
    }

    const response_2 = await fetch(`https://www.funder.co.il/${etf_name_path}`);
    const name_data = await response_2.text();

    const reg = /<title>[\s]*(.+)[\s]*<\/title>/;
    const name_match = name_data.match(reg);

    let name = etf;

    if (name_match.length >= 2) {
      name = name_match[1] + ` (${name})`;
    }

    etfData[name] = etf_data["x"];
  }

  let requestData = async () => {
    await Promise.all(userEtfList.map(etf => fetch_etf(etf)));


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
    setDataReady(true);
  };

  useEffect(() => {
    try {
      const etfs = JSON.parse(localStorage.getItem("userEtfList"));
      if (etfs) {
        setUserEtfList(etfs);
      }
    } catch (e) {
      alert(e);
    }
  }, []);

  useEffect(() => {
    // state set is async, we need the hook to handel change in `handleMonthButtons`
    requestData().then();
  }, [historicMonthCount, userEtfList]);

  function handleUserEtfInputChange() {
    try {
      const data = JSON.parse(etfJsonRef.current.value);
      setUserEtfList(data);
      localStorage.setItem("userEtfList", JSON.stringify(data));
    } catch (e) {
      alert(e);
    }
  }

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
        <h1>ETF Compare</h1>
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
          <Line options={options} data={graphData} height={90} />;
          <Form.Control ref={etfJsonRef} type="text" as="textarea" rows={15} placeholder="JSON list of ETF ids"
                        style={{ width: "80%", marginTop: "10px" }} onBlur={handleUserEtfInputChange}
                        defaultValue={JSON.stringify(userEtfList)} />
        </header>
      </React.StrictMode>,
    </div>
  );
}

export default App;
