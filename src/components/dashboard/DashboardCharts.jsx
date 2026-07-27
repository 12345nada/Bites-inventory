import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  LabelList,
} from "recharts";

import {
  FiBox,
  FiCalendar,
  FiBarChart2,
} from "react-icons/fi";

const eventConditionData = [
  {
    name: "Data Return",
    value: 18,
    color: "#4b250f",
  },

  {
    name: "Damage",
    value: 4,
    color: "#ef741b",
  },

  {
    name: "Missing",
    value: 3,
    color: "#9d938d",
  },
];

const statusColors = {
  Confirmed: "#4b250f",
  "In Progress": "#ef741b",
  Upcoming: "#f4d5b8",
  Completed: "#c8894d",
  Cancelled: "#9d938d",
};

const branchColors = [
  "#4b250f",
  "#cc7b27",
  "#d99a55",
  "#f0c89f",
];
function ChartLegend({
  data,
  total,
}) {
  return (
    <div className="dashboard-chart-legend">
      {data.map((item) => {
        const percentage =
          total === 0
            ? 0
            : Math.round(
                (item.value / total) *
                  100
              );

        return (
          <div
            className="legend-row"
            key={item.name}
          >
            <span
              className="legend-color"
              style={{
                backgroundColor:
                  item.color,
              }}
            />

            <span className="legend-name">
              {item.name}
            </span>

            <strong>
              {item.value} ({percentage}%)
            </strong>
          </div>
        );
      })}
    </div>
  );
}

function DonutCard({
  title,
  data,
  icon,
}) {
  const total = data.reduce(
    (sum, item) =>
      sum + Number(item.value),
    0
  );

  return (
    <div className="chart-card donut-card">
      <div className="chart-card-header">
        <h3>{title}</h3>
      </div>

      <div className="donut-card-body">
        <div className="donut-wrapper">
          <ResponsiveContainer
            width="100%"
            height="100%"
          >
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius="58%"
                outerRadius="82%"
                stroke="none"
              >
                {data.map((item) => (
                  <Cell
                    key={item.name}
                    fill={item.color}
                  />
                ))}
              </Pie>

              <Tooltip
                formatter={(
                  value,
                  name
                ) => [
                  value,
                  name,
                ]}
              />
            </PieChart>
          </ResponsiveContainer>

          <div className="donut-center-icon">
            {icon}
          </div>
        </div>

        <ChartLegend
          data={data}
          total={total}
        />
      </div>
    </div>
  );
}

export default function DashboardCharts({
  events = [],
}) {
  const eventStatusData =
    Object.keys(statusColors).map(
      (status) => {
        const count =
          events.filter(
            (event) =>
              event.status === status
          ).length;

        return {
          name: status,
          value: count,
          color:
            statusColors[status],
        };
      }
    );

  const branchCounts = events.reduce(
    (result, event) => {
      if (!event.branch) {
        return result;
      }

      result[event.branch] =
        (result[event.branch] || 0) +
        1;

      return result;
    },
    {}
  );

  const branchData =
    Object.entries(branchCounts).map(
      ([name, value], index) => ({
        name,
        value,
        fill:
          branchColors[
            index %
              branchColors.length
          ],
      })
    );

  const largestBranchValue =
    Math.max(
      1,
      ...branchData.map(
        (item) => item.value
      )
    );

  return (
    <section className="dashboard-charts">
      <DonutCard
        title="Event Status"
        data={eventConditionData}
        icon={<FiBox />}
      />

      <DonutCard
        title="Event By Status"
        data={eventStatusData}
        icon={<FiCalendar />}
      />

      <div className="chart-card branch-chart-card">
        <div className="chart-card-header">
          <h3>Event By Branch</h3>

          <div className="branch-chart-icon">
            <FiBarChart2 />
          </div>
        </div>

        <div className="branch-chart-wrapper">
          <ResponsiveContainer
            width="100%"
            height="100%"
          >
            <BarChart
              data={branchData}
              margin={{
                top: 24,
                right: 10,
                left: -20,
                bottom: 0,
              }}
              barCategoryGap="45%"
            >
              <CartesianGrid
                stroke="#eee8e2"
                vertical={false}
              />

              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{
                  fontSize: 11,
                  fill: "#4d443e",
                }}
              />

              <YAxis
                domain={[
                  0,
                  largestBranchValue +
                    2,
                ]}
                allowDecimals={false}
                axisLine={false}
                tickLine={false}
                tick={{
                  fontSize: 10,
                  fill: "#4d443e",
                }}
              />

              <Tooltip />

              <Bar
                dataKey="value"
                radius={[
                  4,
                  4,
                  0,
                  0,
                ]}
                barSize={52}
                isAnimationActive
              >
                {branchData.map(
                  (item) => (
                    <Cell
                      key={item.name}
                      fill={item.fill}
                    />
                  )
                )}

                <LabelList
                  dataKey="value"
                  position="top"
                  style={{
                    fill: "#211b17",
                    fontSize: 11,
                    fontWeight: 600,
                  }}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </section>
  );
}