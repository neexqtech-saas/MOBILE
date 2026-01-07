# GET API URLs - Complete List

## Authentication & Session
1. `/api/session-info`

## Attendance
2. `/api/employee-history/{orgId}/{employeeId}?from_date={fromDate}&to_date={toDate}`
3. `/api/employee-attendance/{adminId}?date={date}`
4. `/api/employee-attendance/{adminId}/{userId}?date={date}`
5. `/api/employee-monthly-attendance/{adminId}/{userId}/{month}/{year}`
6. `/api/employee-daily-info/{adminId}`

## Holidays & Leave
7. `/api/holidays/{adminId}`
8. `/api/leave-types/{adminId}`
9. `/api/leave-balances/{adminId}/{userId}?year={year}`
10. `/api/leave-applications/{adminId}/{userId}?year={year}`

## Tasks
11. `/api/task/employee/my-tasks/{adminId}/{userId}?status={status}`

## Production Management
12. `/api/production/work-orders/{adminId}/user/{userId}?status={status}&priority={priority}&date_from={date_from}&date_to={date_to}&search={search}`
13. `/api/production/work-orders/{adminId}/user/{userId}/{workOrderId}`
14. `/api/production/production-entries/{adminId}/user/{userId}?work_order={work_order}&machine={machine}&status={status}&shift={shift}&date_from={date_from}&date_to={date_to}`
15. `/api/production/production-entries/{adminId}/user/{userId}/{entryId}`
16. `/api/production/material-requisitions/{adminId}/user/{userId}?status={status}&date_from={date_from}&date_to={date_to}`
17. `/api/production/material-returns/{adminId}/user/{userId}?date_from={date_from}&date_to={date_to}`
18. `/api/production/scrap-entries/{adminId}/user/{userId}?date_from={date_from}&date_to={date_to}&reason={reason}`
19. `/api/production/machine-downtimes/{adminId}/user/{userId}?machine={machine}&date_from={date_from}&date_to={date_to}`
20. `/api/production/machines/{adminId}?status={status}`
21. `/api/production/machines/{adminId}/user/{userId}`
22. `/api/production/products/{adminId}`
23. `/api/production/raw-materials/{adminId}`

## Organization Settings
24. `/api/organization-settings/{organizationId}`

## Expenses
25. `/api/expense-categories/{adminId}`
26. `/api/expense-projects/{adminId}`
27. `/api/expenses/{adminId}/{userId}`

## Visits
28. `/api/visit/visit-list-create-by-user/{adminId}/{userId}`

