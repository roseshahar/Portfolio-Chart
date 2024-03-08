import React from "react";
import "./App.css";
import { Line } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale } from "chart.js/auto";
import moment from "moment";

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

class App extends React.Component {
  state = {
    data_ready: false,
    etf_data: {},
    graph_data: {},
    labels: []
  };

  async componentDidMount() {
    await this.requestData();
  }

  async fetch_etf(etf) {
    const today = moment(Date.now()).format("YYYY-MM-DD");

    const response = await fetch(`https://www.funder.co.il/wsStock.asmx/GetEtfTickerm?callback=&id=${etf}&startDate=2023-12-08&endDate=${today}`);
    const etf_data = await response.json();

    this.state.etf_data[etf] = etf_data["x"];
    this.state.labels = etf_data["x"].map(item => item.c);
  }

  requestData = async () => {
    let etfs = [1159094, 1159250, 1146646];
    await Promise.all(etfs.map(etf => this.fetch_etf(etf)));

    console.log(this.state.etf_data);
    console.log(this.state.labels);

    let data_sets = [];

    for (let key in this.state.etf_data) {
      let curr_data = this.state.etf_data[key];
      let base = curr_data[0].p;

      data_sets.push(
        {
          label: key,
          fill: true,
          data: curr_data.map(item => (item.p / base) - 1)
        }
      );
    }

    this.setState(
      {
        data_ready: true,
        graph_data: {
          labels: this.state.labels,
          datasets: data_sets
        }
      }
    );
  };

  render() {
    if (!this.state.data_ready) {
      return <div>Loading...</div>;
    }

    return (
      <div className="App">
        <h1>hello</h1>
        <header className="App-header">
          <Line options={options} data={this.state.graph_data} />;
        </header>
      </div>
    );
  }
}

export default App;
