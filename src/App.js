import React from "react";
import "./App.css";
import { Line } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale } from "chart.js/auto";
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

class App extends React.Component {
  state = {
    data_ready: false,
    etf_data: {},
    graph_data: {},
    labels: [],
    historic_month_count: 1
  };
  chart = React.createRef();

  async componentDidMount() {
    await this.requestData();
  }

  async fetch_etf(etf) {
    const today = moment(Date.now()).format("YYYY-MM-DD");

    let start_date = new Date();
    start_date.setMonth(start_date.getMonth() - this.state.historic_month_count);
    start_date = moment(start_date).format("YYYY-MM-DD");
    console.log("start_date", start_date, this.state.historic_month_count);

    const response = await fetch(`https://www.funder.co.il/wsStock.asmx/GetEtfTickerm?callback=&id=${etf}&startDate=${start_date}&endDate=${today}`);
    const etf_data = await response.json();

    this.state.etf_data[etf] = etf_data["x"];
  }

  requestData = async () => {
    let etfs = [1159094, 1159250, 1146646];
    await Promise.all(etfs.map(etf => this.fetch_etf(etf)));


    let data_sets = [];
    let labels = [];

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
      labels = curr_data.map(item => item.c);
    }

    console.log(this.state.etf_data);
    console.log(labels);

    this.setState(
      {
        graph_data: {
          labels: labels,
          datasets: data_sets
        },
        data_ready: true
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
        <div>
          <Button variant="secondary"
                  onClick={() => {
                    this.setState({ historic_month_count: 1, data_ready: false });
                    this.requestData().then(r => {
                    });
                  }}>1 Month</Button>
          <Button variant="secondary"
                  onClick={() => {
                    this.setState({ historic_month_count: 3, data_ready: false });
                    this.requestData().then(r => {
                    });
                  }}>3 Months</Button>
          <Button variant="secondary"
                  onClick={() => {
                    this.setState({ historic_month_count: 6, data_ready: false });
                    this.requestData().then(r => {
                    });
                  }}>6 Months</Button>
        </div>
        <header className="App-header">
          <Line ref={this.chart} options={options} data={this.state.graph_data} redraw={true} />;
        </header>
      </div>
    );
  }
}

export default App;
