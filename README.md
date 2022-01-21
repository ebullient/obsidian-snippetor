# Snippetor

Snippetor helps you create common CSS snippets with a few button clicks: 
- Custom tasks
- *more to come...*

**Complementary Plugins**
- [My Snippets](https://github.com/chetachiezikeuzor/MySnippets-Plugin) to view/toggle your snippets from the status bar
- [Task Collector](https://github.com/ebullient/obsidian-task-collector) to mark your tasks with a few keystrokes 

## Installing Snippetor

### Preview with Beta Reviewers Auto-update Tester (BRAT)

1. Install BRAT
    1. Open `Settings` -> `Community Plugins`
    2. Disable safe mode
    3. *Browse*, and search for "BRAT" 
    4. Install the latest version of **Obsidian 42 - BRAT**
2. Open BRAT settings (`Settings` -> `Obsidian 42 - BRAT`)
    1. Scroll to the `Beta Plugin List` section
    2. `Add Beta Plugin`
    3. Specify this repository: `ebullient/obsidian-snippetor`
3. Enable the plugin (`Settings` -> `Community Plugins`)

## Using the plugin

1. Open `Settings` -> `Snippetor`
2. Create a new snippet
    1. Right now, you can only choose "Custom Checkboxes"
    2. Click `+`
    
This will open a modal dialog for editing settings associated with the snippet. 

All modal dialogs have a field at the top for specifying the name of the generated snippet file. This name is automatically populated with a `kebeb-case` string. Feel free to replace it with something you like better.

### Custom Checkboxes

The configuration for custom checkboxes are presented in the format of a task list. Each line begins with a preview of what the rendered task will look like, along with some sample text. The rest of the line has settings that will toggle the appearance of that item.

- The first text field allows you to specify the value you will use when completing the task. `x` is the default. 
- The color picker allows you to change the foreground color for the checkbox.
- A small moon phase icon is next. There is a toggle that has the same icon. The toggle alows you to switcth the settings panel between light and dark modes. The icon next to the picker allows you to copy the color from the other mode. For example: if you start in dark mode, and choose a bright red for x, you can use the toggle to flip to light mode, use this small icon to copy that bright red, and then adjust the color so that your task looks good in light mode, too.

There are additional checkboxes and settings that should be self-explanatory. Use the `+` and `trashcan` buttons to add and remove custom tasks from the list.

When your tasks are configured the way you want them (don't panic, your settings will be saved, you can tweak this any time you like), use the "magic wand" button next to the file name to create your snippet. 

You're almost there! The only step left is to enable your snippet.

Open `Settings` -> `Appearance`, scroll down to `CSS Snippets`. If your snippet is not there, you may need to reload the list. Use the toggle to enable your snippet! Alternately, use the [My Snippets](https://github.com/chetachiezikeuzor/MySnippets-Plugin) plugin.

#### My tasks look weird!

Some themes do a lot of customization for task lists. The way Snippetor works, you should be able to tell, just from the configuration settings, if you're going to have a conflict with your theme. There is a toggle at the bottom of the settings pane that will try to apply some known fixes, but you may need to check the theme settings (using [Style Settings](https://github.com/mgmeyers/obsidian-style-settings) or something theme-specific) to see if task list formatting can be disabled or modified to work better with this snippet.

## Acknowledgements

- [My Snippets](https://github.com/chetachiezikeuzor/MySnippets-Plugin) -- Chetachi's plugin is an excellent source (and a complement to this)
- [Fantasy Calendar](https://github.com/valentine195/obsidian-fantasy-calendar) as a plugin with complicated modal settings
- [Style Settings](https://github.com/mgmeyers/obsidian-style-settings/) for the color picker and dynamic style setting
- [Font Awesome: Magic Wand](https://fontawesome.com/v5.15/icons/magic?style=solid) ([License](https://fontawesome.com/license))
