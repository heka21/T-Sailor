import { createBrowserRouter } from 'react-router'
import { Layout } from './Layout'
import { HomePage } from '../features/home/HomePage'
import { CoursesPage } from '../features/courses/CoursesPage'
import { CoursePage } from '../features/courses/CoursePage'
import { LessonPage } from '../features/courses/LessonPage'
import { LabPage, SimPage } from '../features/lab/LabPage'
import { ToolboxPage, ToolPage } from '../features/toolbox/ToolboxPage'
import { WeatherPage } from '../features/weather/WeatherPage'
import { ProfilePage } from '../features/account/ProfilePage'
import { AdminPage } from '../features/account/AdminPage'
import { NotFound } from './NotFound'

export const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'courses', element: <CoursesPage /> },
      { path: 'courses/:courseId', element: <CoursePage /> },
      { path: 'courses/:courseId/:slug', element: <LessonPage /> },
      { path: 'lab', element: <LabPage /> },
      { path: 'lab/:simId', element: <SimPage /> },
      { path: 'toolbox', element: <ToolboxPage /> },
      { path: 'toolbox/:toolId', element: <ToolPage /> },
      { path: 'weather', element: <WeatherPage /> },
      { path: 'profile', element: <ProfilePage /> },
      { path: 'admin', element: <AdminPage /> },
      { path: '*', element: <NotFound /> },
    ],
  },
])
