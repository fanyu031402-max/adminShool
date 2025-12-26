<template>
    <div class="enhanced-table">
      <el-table
        :data="tableData"
        border
        stripe
        @selection-change="handleSelectionChange"
        v-loading="loading"
      >
        <!-- 多选列 -->
        <el-table-column
          v-if="showSelection"
          type="selection"
          width="55"
          align="center"
        ></el-table-column>
  
        <!-- 序号列 -->
        <el-table-column
          v-if="showIndex"
          label="序号"
          type="index"
          width="80"
          align="center"
        >
          <template slot-scope="scope">
            <span>{{ calcIndex(scope.$index) }}</span>
          </template>
        </el-table-column>
  
        <!-- 动态数据列 -->
        <template v-for="(col, index) in columns">
          <el-table-column
            :key="index"
            v-bind="col"
            :align="col.align || 'left'"
          >
            <template slot-scope="scope">
              <slot v-if="col.slotName" :name="col.slotName" :row="scope.row"></slot>
              <span v-else>{{ scope.row[col.prop] }}</span>
            </template>
          </el-table-column>
        </template>
  
        <!-- 操作列 -->
        <el-table-column
          v-if="$scopedSlots.actions"
          label="操作"
          width="180"
          fixed="right"
        >
          <template slot-scope="scope">
            <slot name="actions" :row="scope.row" :index="calcIndex(scope.$index)"></slot>
          </template>
        </el-table-column>
      </el-table>
  
      <!-- 分页区域 -->
      <div v-if="showPagination" class="pagination-wrapper">
        <div v-if="showSelection" class="selection-info">
          已选 {{ selectedRows.length }} 条
          <el-button
            v-if="selectedRows.length > 0"
            type="text"
            @click="clearSelection"
          >清空</el-button>
        </div>
        
        <el-pagination
          :current-page="pagination.page"
          :page-sizes="[10, 20, 50, 100]"
          :page-size="pagination.size"
          :total="pagination.total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </div>
  </template>
  
  <script>
  export default {
    name: 'EnhancedTable',
    props: {
      columns: {
        type: Array,
        default: () => []
      },
      data: {
        type: Array,
        default: () => []
      },
      pagination: {
        type: Object,
        default: () => ({
          page: 1,
          size: 10,
          total: 0
        })
      },
      showPagination: {
        type: Boolean,
        default: true
      },
      showSelection: {  // 新增多选控制
        type: Boolean,
        default: false
      },
      showIndex: {      // 新增序号控制
        type: Boolean,
        default: true
      },
      loading: Boolean
    },
    data() {
      return {
        selectedRows: []  // 存储选中行数据
      }
    },
    computed: {
      tableData() {
        return this.data || []
      }
    },
    methods: {
      // 计算带分页的序号
      calcIndex(index) {
        return (this.pagination.page - 1) * this.pagination.size + index + 1
      },
      
      // 分页处理
      handleSizeChange(size) {
        this.$emit('pagination-change', { ...this.pagination, size, page: 1 })
      },
      
      handleCurrentChange(page) {
        this.$emit('pagination-change', { ...this.pagination, page })
      },
      
      // 多选处理
      handleSelectionChange(selection) {
        this.selectedRows = selection
        this.$emit('selection-change', selection)
      },
      
      // 清空选择
      clearSelection() {
        this.$refs.table.clearSelection()
      }
    }
  }
  </script>
  
  <style lang="less" scoped>
  .enhanced-table {
    margin: 16px 0;
    
    ::v-deep .el-table {
      .el-table__header-wrapper .el-checkbox {
        margin-left: 8px;
      }
      
      .el-table__fixed-right {
        box-shadow: -2px 0 4px rgba(0, 0, 0, 0.08);
      }
    }
    
    .pagination-wrapper {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 16px;
      
      .selection-info {
        color: #666;
        font-size: 14px;
        
        .el-button {
          margin-left: 12px;
          padding: 0;
        }
      }
    }
  }
  </style>
  