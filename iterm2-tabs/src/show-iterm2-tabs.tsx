import { useEffect, useState } from "react";
import { Action, ActionPanel, List, showToast, Toast, Icon, Color } from "@raycast/api";
import { runAppleScript } from "run-applescript";

// Define Tab interface
interface Tab {
  title: string;
  id: string;
}

export default function Command() {
  const [tabs, setTabs] = useState<Tab[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchText, setSearchText] = useState("");
  const [filteredList, setFilteredList] = useState<Tab[]>([]);

  // Load iTerm2 tabs data
  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log("Fetching iTerm2 tabs...");

        const script = `
          set json_items to {}
          
          tell application "iTerm"
            set session_names to {}
            repeat with w in windows
              repeat with t in tabs of w
                repeat with s in sessions of t
                  copy name of s to end of session_names
                end repeat
              end repeat
            end repeat
            
            repeat with n in session_names
              set end of json_items to "{\\"title\\":\\"" & n & "\\", \\"arg\\":\\"" & n & "\\"},"
            end repeat
          end tell
          
          set json_output to text 1 thru -2 of (items of json_items as string)
          set json_output to "{\\"items\\": [" & json_output & "]}"
          return json_output
        `;

        console.log("Running AppleScript...");
        const result = await runAppleScript(script);
        console.log("AppleScript result received");

        try {
          const data = JSON.parse(result);
          console.log(`Parsed data: ${JSON.stringify(data, null, 2)}`);

          if (data.items && data.items.length > 0) {
            console.log(`Found ${data.items.length} tabs`);
            setTabs(data.items);
            setFilteredList(data.items);
          } else {
            console.log("No tabs found");
            showToast({
              style: Toast.Style.Failure,
              title: "No iTerm2 tabs found",
            });
          }
        } catch (parseError) {
          console.error("JSON parsing error:", parseError);
          console.error("Raw result:", result);
          showToast({
            style: Toast.Style.Failure,
            title: "Error parsing iTerm2 response",
            message: String(parseError),
          });
        }
      } catch (error) {
        console.error("Error fetching iTerm2 tabs:", error);
        showToast({
          style: Toast.Style.Failure,
          title: "Error running AppleScript",
          message: String(error),
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Filter tabs
  useEffect(() => {
    if (searchText) {
      console.log(`Filtering tabs with search text: "${searchText}"`);
      setFilteredList(tabs.filter((tab) => tab.title.toLowerCase().includes(searchText.toLowerCase())));
    } else {
      setFilteredList(tabs);
    }
  }, [searchText, tabs]);

  // Handle tab selection
  const handleSelectTab = (tab: Tab) => {
    console.log(`Selected tab: ${tab.title} (${tab.id})`);
    showToast({
      style: Toast.Style.Success,
      title: `Selected: ${tab.title}`,
    });

    activateTab(tab);
  };

  // Separate async function
  const activateTab = async (tab: Tab) => {
    try {
      console.log(`Activating tab: ${tab.id}`);
      const activeScript = `
        set the_query to "${tab.title}"
        tell application "iTerm"
          activate
          repeat with w in windows
            repeat with t in tabs of w
              repeat with s in sessions of t
                set the_name to the name of s
                if the_name = the_query then
                  log the_name
                  select w
                  select t
                  select s
                  return
                end if
              end repeat
            end repeat
          end repeat
        end tell
      `;
      await runAppleScript(activeScript);
    } catch (error) {
      console.error("Error activating tab:", error);
      showToast({
        style: Toast.Style.Failure,
        title: "Operation failed",
        message: String(error),
      });
    }
  };

  // Get a random color for each tab
  const getTabColor = (title: string) => {
    const colors = [Color.Blue, Color.Green, Color.Orange, Color.Purple, Color.Red, Color.Yellow];
    const index = Math.abs(title.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0)) % colors.length;
    return colors[index];
  };

  return (
    <List
      isLoading={isLoading}
      onSearchTextChange={setSearchText}
      searchBarPlaceholder="Search iTerm2 tabs..."
      navigationTitle="iTerm2 Tabs"
    >
      {filteredList.map((tab) => {
        return (
          <List.Item
            key={tab.id}
            title={tab.title}
            icon={{ source: Icon.Terminal, tintColor: getTabColor(tab.title) }}
            accessories={[{ text: tab.title, tooltip: "Full tab title" }, { icon: Icon.Window }]}
            keywords={[tab.title]}
            actions={
              <ActionPanel>
                <ActionPanel.Section>
                  <Action title="Select Tab" icon={Icon.ArrowRight} onAction={() => handleSelectTab(tab)} />
                </ActionPanel.Section>
              </ActionPanel>
            }
          />
        );
      })}
    </List>
  );
}
