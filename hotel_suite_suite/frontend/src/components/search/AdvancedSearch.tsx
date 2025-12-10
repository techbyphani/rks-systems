import React, { useState, useRef, useEffect } from 'react'
import { Input, Dropdown, Space, Typography, Divider, Tag } from 'antd'
import { SearchOutlined, FilterOutlined, CloseOutlined } from '@ant-design/icons'
import './AdvancedSearch.css'

const { Text } = Typography
const { Search } = Input

export interface SearchFilter {
  key: string
  label: string
  type: 'text' | 'select' | 'date' | 'dateRange'
  options?: { label: string; value: string }[]
}

interface AdvancedSearchProps {
  placeholder?: string
  onSearch: (value: string, filters?: Record<string, any>) => void
  filters?: SearchFilter[]
  quickFilters?: { label: string; value: string; onClick: () => void }[]
  allowClear?: boolean
  size?: 'small' | 'middle' | 'large'
  style?: React.CSSProperties
}

export default function AdvancedSearch({
  placeholder = 'Search...',
  onSearch,
  filters = [],
  quickFilters = [],
  allowClear = true,
  size = 'middle',
  style
}: AdvancedSearchProps) {
  const [searchValue, setSearchValue] = useState('')
  const [activeFilters, setActiveFilters] = useState<Record<string, any>>({})
  const [showFilters, setShowFilters] = useState(false)
  const searchRef = useRef<any>(null)

  const handleSearch = (value: string) => {
    setSearchValue(value)
    onSearch(value, activeFilters)
  }

  const handleFilterChange = (key: string, value: any) => {
    const newFilters = { ...activeFilters, [key]: value }
    setActiveFilters(newFilters)
    onSearch(searchValue, newFilters)
  }

  const clearFilters = () => {
    setActiveFilters({})
    setSearchValue('')
    onSearch('', {})
    if (searchRef.current) {
      searchRef.current.input.value = ''
    }
  }

  const hasActiveFilters = Object.keys(activeFilters).length > 0 || searchValue

  const filterMenu = filters.length > 0 ? (
    <div className="advanced-search-filter-menu">
      <div className="filter-menu-header">
        <Text strong>Filters</Text>
        {hasActiveFilters && (
          <a
            onClick={clearFilters}
            style={{ fontSize: '12px', cursor: 'pointer' }}
          >
            Clear all
          </a>
        )}
      </div>
      <Divider style={{ margin: '8px 0' }} />
      <div className="filter-menu-content">
        {filters.map((filter) => (
          <div key={filter.key} className="filter-item">
            <Text strong style={{ fontSize: '12px', display: 'block', marginBottom: '4px' }}>
              {filter.label}
            </Text>
            {filter.type === 'select' && filter.options ? (
              <select
                className="filter-select"
                value={activeFilters[filter.key] || ''}
                onChange={(e) => handleFilterChange(filter.key, e.target.value)}
              >
                <option value="">All</option>
                {filter.options.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            ) : (
              <Input
                size="small"
                placeholder={`Filter by ${filter.label.toLowerCase()}`}
                value={activeFilters[filter.key] || ''}
                onChange={(e) => handleFilterChange(filter.key, e.target.value)}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  ) : null

  return (
    <div className="advanced-search" style={style}>
      <Space.Compact style={{ width: '100%' }}>
        <Search
          ref={searchRef}
          placeholder={placeholder}
          allowClear={allowClear}
          size={size}
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          onSearch={handleSearch}
          enterButton
          style={{ flex: 1 }}
        />
        {filters.length > 0 && (
          <Dropdown
            dropdownRender={() => filterMenu}
            trigger={['click']}
            open={showFilters}
            onOpenChange={setShowFilters}
            placement="bottomRight"
          >
            <button
              className={`filter-button ${hasActiveFilters ? 'active' : ''}`}
              type="button"
            >
              <FilterOutlined />
              {Object.keys(activeFilters).length > 0 && (
                <span className="filter-badge">{Object.keys(activeFilters).length}</span>
              )}
            </button>
          </Dropdown>
        )}
      </Space.Compact>
      
      {quickFilters.length > 0 && (
        <div className="quick-filters">
          <Space size="small" wrap>
            {quickFilters.map((filter) => (
              <Tag
                key={filter.value}
                onClick={filter.onClick}
                style={{ cursor: 'pointer' }}
              >
                {filter.label}
              </Tag>
            ))}
          </Space>
        </div>
      )}
      
      {hasActiveFilters && (
        <div className="active-filters">
          <Space size="small" wrap>
            {searchValue && (
              <Tag
                closable
                onClose={() => {
                  setSearchValue('')
                  onSearch('', activeFilters)
                }}
              >
                Search: {searchValue}
              </Tag>
            )}
            {Object.entries(activeFilters).map(([key, value]) => {
              const filter = filters.find(f => f.key === key)
              return (
                <Tag
                  key={key}
                  closable
                  onClose={() => handleFilterChange(key, undefined)}
                >
                  {filter?.label}: {value}
                </Tag>
              )
            })}
          </Space>
        </div>
      )}
    </div>
  )
}

