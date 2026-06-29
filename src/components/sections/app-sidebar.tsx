import { Link, useLocation } from "@tanstack/react-router"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "../ui/sidebar"
import {
  IconBell,
  IconBellFilled,
  IconBook,
  IconBookFilled,
  IconClipboardText,
  IconClipboardTextFilled,
  IconFileCheck,
  IconFileCheckFilled,
  IconLayoutDashboard,
  IconLayoutDashboardFilled,
  IconUser,
} from "@tabler/icons-react"

const NAV_LINKS = [
  {
    title: "Overview",
    to: "/",
    exactPath: true,
    icon: IconLayoutDashboard,
    fillIcon: IconLayoutDashboardFilled,
  },
  {
    title: "Courses",
    to: "/courses",
    icon: IconBook,
    fillIcon: IconBookFilled,
  },
  {
    title: "Assignments",
    to: "/assignments",
    icon: IconClipboardText,
    fillIcon: IconClipboardTextFilled,
  },
  {
    title: "Submissions",
    to: "/submissions",
    icon: IconFileCheck,
    fillIcon: IconFileCheckFilled,
  },
  {
    title: "Notifications",
    to: "/notifications",
    icon: IconBell,
    fillIcon: IconBellFilled,
  },
  { title: "Profile", to: "/Profile", icon: IconUser },
]

export function AppSidebar() {
  const { pathname } = useLocation()
  const { setOpenMobile } = useSidebar()

  return (
    <Sidebar variant="floating" collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              render={<Link to="/" onClick={() => setOpenMobile(false)} />}
              className="in-data-[state=collapsed]:flex-center in-data-[state=collapsed]:p-0! data-[slot=sidebar-menu-button]:p-1.5!"
            >
              <span className="font-logo text-primary in-data-[state=collapsed]:flex-center font-extrabold not-md:text-2xl md:text-xl">
                m<span className="in-data-[state=collapsed]:hidden">ìlà</span>
              </span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {NAV_LINKS.map(
                ({ to, title, icon: Icon, exactPath, fillIcon: FillIcon }) => {
                  const isActive = exactPath
                    ? pathname === to
                    : pathname.startsWith(to)

                  return (
                    <SidebarMenuItem key={`${to}-${title}`}>
                      <SidebarMenuButton
                        size="default"
                        isActive={isActive}
                        tooltip={title}
                        render={
                          <Link
                            to={to}
                            className="text-base! not-md:h-10"
                            onClick={() => setOpenMobile(false)}
                          />
                        }
                      >
                        {FillIcon && isActive ? (
                          <FillIcon className="shrink-0 not-md:size-5!" />
                        ) : (
                          <Icon className="shrink-0 not-md:size-5!" />
                        )}
                        {title}
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )
                },
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}
