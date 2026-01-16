import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  Space,
  Typography,
  Button,
  Select,
  Tag,
  Tooltip,
  Row,
  Col,
  Spin,
  message,
  Badge,
} from 'antd';
import {
  LeftOutlined,
  RightOutlined,
  PlusOutlined,
  UnorderedListOutlined,
} from '@ant-design/icons';
import dayjs, { Dayjs } from 'dayjs';
import { PageHeader } from '@/components/shared';
import { reservationService, roomService } from '@/api';
import { useAppContext } from '@/context/AppContext';
import type { Reservation, RoomType } from '@/types';

// CSS for the calendar grid
const calendarStyles = `
  .calendar-grid {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    border: 1px solid #f0f0f0;
    border-radius: 8px;
    overflow: hidden;
  }
  .calendar-header-cell {
    text-align: center;
    padding: 12px 8px;
    font-weight: 600;
    background: #fafafa;
    border-bottom: 1px solid #f0f0f0;
    color: #595959;
  }
  .calendar-day-cell {
    min-height: 110px;
    padding: 8px;
    border-right: 1px solid #f0f0f0;
    border-bottom: 1px solid #f0f0f0;
    background: #fff;
    transition: background 0.2s;
  }
  .calendar-day-cell:nth-child(7n) {
    border-right: none;
  }
  .calendar-day-cell:hover {
    background: #f5f5f5;
  }
  .calendar-day-cell.other-month {
    background: #fafafa;
    opacity: 0.6;
  }
  .calendar-day-cell.today {
    background: #e6f7ff;
  }
  .calendar-day-number {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 6px;
  }
  .calendar-day-tags {
    display: flex;
    flex-direction: column;
    gap: 3px;
  }
`;

const { Text, Title } = Typography;

interface CalendarDay {
  date: Dayjs;
  reservations: Reservation[];
  arrivals: number;
  departures: number;
  stayovers: number;
}

export default function CalendarPage() {
  const navigate = useNavigate();
  const { tenant } = useAppContext();
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(dayjs());
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
  const [selectedRoomType, setSelectedRoomType] = useState<string | undefined>();

  useEffect(() => {
    if (tenant?.id) {
      loadData();
    }
  }, [currentMonth, selectedRoomType, tenant?.id]);

  const loadData = async () => {
    if (!tenant?.id) return;
    setLoading(true);
    try {
      const startDate = currentMonth.startOf('month').format('YYYY-MM-DD');
      const endDate = currentMonth.endOf('month').format('YYYY-MM-DD');
      
      const [reservationsData, roomTypesData] = await Promise.all([
        reservationService.getByDateRange(tenant.id, startDate, endDate, selectedRoomType),
        roomService.getRoomTypes(tenant.id),
      ]);
      
      setReservations(reservationsData);
      setRoomTypes(roomTypesData);
    } catch (error) {
      message.error('Failed to load calendar data');
    } finally {
      setLoading(false);
    }
  };

  const calendarDays = useMemo(() => {
    const days: CalendarDay[] = [];
    const startOfMonth = currentMonth.startOf('month');
    const endOfMonth = currentMonth.endOf('month');
    const startOfCalendar = startOfMonth.startOf('week');
    const endOfCalendar = endOfMonth.endOf('week');
    
    let day = startOfCalendar;
    while (day.isBefore(endOfCalendar) || day.isSame(endOfCalendar, 'day')) {
      const currentDay = day;
      const dayReservations = reservations.filter((res) => {
        const checkIn = dayjs(res.checkInDate);
        const checkOut = dayjs(res.checkOutDate);
        return (
          currentDay.isSame(checkIn, 'day') ||
          currentDay.isSame(checkOut, 'day') ||
          (currentDay.isAfter(checkIn, 'day') && currentDay.isBefore(checkOut, 'day'))
        );
      });

      const arrivals = reservations.filter((res) =>
        dayjs(res.checkInDate).isSame(currentDay, 'day')
      ).length;

      const departures = reservations.filter((res) =>
        dayjs(res.checkOutDate).isSame(currentDay, 'day')
      ).length;

      const stayovers = dayReservations.filter((res) => {
        const checkIn = dayjs(res.checkInDate);
        const checkOut = dayjs(res.checkOutDate);
        return currentDay.isAfter(checkIn, 'day') && currentDay.isBefore(checkOut, 'day');
      }).length;

      days.push({
        date: currentDay,
        reservations: dayReservations,
        arrivals,
        departures,
        stayovers,
      });
      day = day.add(1, 'day');
    }
    
    return days;
  }, [currentMonth, reservations]);

  const handlePrevMonth = () => {
    setCurrentMonth(currentMonth.subtract(1, 'month'));
  };

  const handleNextMonth = () => {
    setCurrentMonth(currentMonth.add(1, 'month'));
  };

  const handleToday = () => {
    setCurrentMonth(dayjs());
  };

  const getDayColor = (day: CalendarDay) => {
    if (day.arrivals > 0 && day.departures > 0) return '#faad14';
    if (day.arrivals > 0) return '#52c41a';
    if (day.departures > 0) return '#1890ff';
    if (day.stayovers > 0) return '#722ed1';
    return undefined;
  };

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <PageHeader
        title="Reservation Calendar"
        subtitle="Visual overview of reservations, arrivals, and departures"
        breadcrumbs={[
          { label: 'CRS', path: '/suite/crs' },
          { label: 'Calendar' },
        ]}
        actions={
          <Space>
            <Button icon={<UnorderedListOutlined />} onClick={() => navigate('/suite/crs/reservations')}>
              List View
            </Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/suite/crs/reservations')}>
              New Reservation
            </Button>
          </Space>
        }
      />

      <Card>
        {/* Calendar Controls */}
        <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
          <Col>
            <Space>
              <Button icon={<LeftOutlined />} onClick={handlePrevMonth} />
              <Button icon={<RightOutlined />} onClick={handleNextMonth} />
              <Button onClick={handleToday}>Today</Button>
              <Title level={4} style={{ margin: 0 }}>
                {currentMonth.format('MMMM YYYY')}
              </Title>
            </Space>
          </Col>
          <Col>
            <Space>
              <Select
                placeholder="All Room Types"
                allowClear
                style={{ width: 200 }}
                value={selectedRoomType}
                onChange={setSelectedRoomType}
                options={roomTypes.map((rt) => ({
                  label: rt.name,
                  value: rt.id,
                }))}
              />
            </Space>
          </Col>
        </Row>

        {/* Legend */}
        <Row style={{ marginBottom: 16 }}>
          <Space size="large">
            <Space>
              <Badge color="#52c41a" />
              <Text type="secondary">Arrivals</Text>
            </Space>
            <Space>
              <Badge color="#1890ff" />
              <Text type="secondary">Departures</Text>
            </Space>
            <Space>
              <Badge color="#faad14" />
              <Text type="secondary">Both</Text>
            </Space>
            <Space>
              <Badge color="#722ed1" />
              <Text type="secondary">In-house</Text>
            </Space>
          </Space>
        </Row>

        {/* Inject calendar styles */}
        <style>{calendarStyles}</style>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 60 }}>
            <Spin size="large" />
          </div>
        ) : (
          <div className="calendar-grid">
            {/* Week Days Header */}
            {weekDays.map((day) => (
              <div key={day} className="calendar-header-cell">
                {day}
              </div>
            ))}

            {/* Calendar Days */}
            {calendarDays.map((day) => {
              const isCurrentMonth = day.date.month() === currentMonth.month();
              const isToday = day.date.isSame(dayjs(), 'day');
              const dayColor = getDayColor(day);

              const cellClasses = [
                'calendar-day-cell',
                !isCurrentMonth && 'other-month',
                isToday && 'today',
              ].filter(Boolean).join(' ');

              return (
                <div key={day.date.format('YYYY-MM-DD')} className={cellClasses}>
                  <div className="calendar-day-number">
                    <Text
                      strong={isToday}
                      style={{
                        fontSize: 14,
                        color: isToday ? '#1890ff' : undefined,
                      }}
                    >
                      {day.date.date()}
                    </Text>
                    {dayColor && (
                      <div
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          background: dayColor,
                        }}
                      />
                    )}
                  </div>

                  <div className="calendar-day-tags">
                    {day.arrivals > 0 && (
                      <Tooltip title={`${day.arrivals} arrival(s)`}>
                        <Tag color="green" style={{ fontSize: 10, margin: 0, cursor: 'default' }}>
                          ↓ {day.arrivals} IN
                        </Tag>
                      </Tooltip>
                    )}
                    {day.departures > 0 && (
                      <Tooltip title={`${day.departures} departure(s)`}>
                        <Tag color="blue" style={{ fontSize: 10, margin: 0, cursor: 'default' }}>
                          ↑ {day.departures} OUT
                        </Tag>
                      </Tooltip>
                    )}
                    {day.stayovers > 0 && (
                      <Tooltip title={`${day.stayovers} in-house`}>
                        <Tag color="purple" style={{ fontSize: 10, margin: 0, cursor: 'default' }}>
                          ● {day.stayovers}
                        </Tag>
                      </Tooltip>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Summary Stats */}
      <Row gutter={16}>
        <Col xs={24} sm={8}>
          <Card size="small">
            <Text type="secondary">Total Arrivals This Month</Text>
            <Title level={3} style={{ margin: 0, color: '#52c41a' }}>
              {reservations.filter((r) =>
                dayjs(r.checkInDate).month() === currentMonth.month()
              ).length}
            </Title>
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card size="small">
            <Text type="secondary">Total Departures This Month</Text>
            <Title level={3} style={{ margin: 0, color: '#1890ff' }}>
              {reservations.filter((r) =>
                dayjs(r.checkOutDate).month() === currentMonth.month()
              ).length}
            </Title>
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card size="small">
            <Text type="secondary">Total Room Nights</Text>
            <Title level={3} style={{ margin: 0, color: '#722ed1' }}>
              {reservations.reduce((acc, r) => acc + r.nights, 0)}
            </Title>
          </Card>
        </Col>
      </Row>
    </Space>
  );
}
