# Snippetor
[![GitHub tag (Latest by date)](https://img.shields.io/github/v/tag/ebullient/obsidian-snippetor)](https://github.com/ebullient/obsidian-snippetor/releases) ![GitHub all releases](https://img.shields.io/github/downloads/ebullient/obsidian-snippetor/total?color=success)

Snippetor helps you create common CSS snippets with a few button clicks: 
- Custom tasks
- *more to come...*

**Complementary Plugins**
- [My Snippets](https://github.com/chetachiezikeuzor/MySnippets-Plugin) to view/toggle your snippets from the status bar
- [Task Collector](https://github.com/ebullient/obsidian-task-collector) to mark your tasks with a few keystrokes 

## Installing Snippetor

1. Open `Settings` -> `Community Plugins`
2. Disable safe mode
3. **Browse** and search for "snippetor"
3. Install the latest version of Snippetor
4. "Enable" the plugin directly after installation 

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
    1. Choose the type of snippet you want to create: 
        - "Custom Checkboxes" for create a custom checkbox snippet, or 
        - "Colored folders" to create a snippet that customizes the display of folders in the navigation pane.
    2. Click `+`
    
This will open a modal dialog for editing settings associated with the snippet. 

All modal dialogs have a field at the top for specifying the name of the generated snippet file. This name is automatically populated with a `kebeb-case` string. Feel free to replace it with something you like better.

### To use the snippet you create: 

1. Generate (or update) the snippet by pressing the "magic wand" button: 
    <img width="750" alt="image" src="https://user-images.githubusercontent.com/808713/170642467-fa1994aa-b4ab-4e83-a03e-6c94a843be16.png">

2. Enable the Snippet
    - Settings -> Appearance, scroll down to the bottom and ensure the snippet is present and enabled
    - Use a plugin like [MySnippets](https://github.com/chetachiezikeuzor/MySnippets-Plugin) to list and toggle snippets.


### Custom Checkboxes

The configuration for custom checkboxes are presented in the format of a task list. Each line begins with a preview of what the rendered task will look like, along with some sample text. The rest of the line has settings that will toggle the appearance of that item.

<img width="991" alt="image" src="https://user-images.githubusercontent.com/808713/170642901-c702e999-6279-4910-b7bb-f0413bfa3e3e.png">

There is a lot going on here. It is literally a Wall of Toggles!

The top row has a few things going on: 

<img width="583" alt="image" src="https://user-images.githubusercontent.com/808713/170643652-1f796dca-0daa-4d1c-bd1a-c42cd9482beb.png">

- The slider is used to adjust the roundness of corners for all checkboxes.
- The palette allows you to toggle between color pickers and text controls for working with colors. For example, you can use the text field input to reference a CSS variable.
- A moon-phase icon is next, and this allows toggling the entire panel between light mode and dark mode so you can see the impact your settings will have.
- Finally, there is a reset button that is useful when you want to scrap changes and return to a previously saved state.

#### In the simple / single row view, each task has only a few values: 

- Some preview text, to show what the rendered checkbox and text will look like (with some amount of approximation).
- An example of what the checkbox looks like in edit mode, along with a field to define a new task value (`x` is the default).
- Two color pickers follow: one for the foreground, and one for the background. Each has three elements: 
    - A color picker for selection OR a text-box for manual entry.
    - A small moon phase icon, which allows you to copy the color from the opposite (light/dark) mode. For example: if you start in dark mode, and choose a bright red for x, you can use the toggle in the top row to flip to light mode, and then use this small icon in the row to copy that bright red, and then adjust the color so that your task looks good in light mode, too.
- There is a button to hide the checkbox border
- And another to disallow mouse actions (keyboard would still work), to make it harder to accidentally change a value in reading mode.
- There is an icon at the end of the row that will expand to show... even more settings!
- And finally, we have a trashcan, so you can delete this snippet creator if you want.

Use the `+` and `trashcan` buttons to add and remove custom tasks from the list.

When your tasks are configured the way you want them (don't panic, your settings will be saved, you can tweak this any time you like), use the "magic wand" button next to the file name to create your snippet. 

You're almost there! The only step left is to enable your snippet.

Open `Settings` -> `Appearance`, scroll down to `CSS Snippets`. If your snippet is not there, you may need to reload the list. Use the toggle to enable your snippet! Alternately, use the [My Snippets](https://github.com/chetachiezikeuzor/MySnippets-Plugin) plugin.

#### My tasks look weird!

Some themes do a lot of customization for task lists. If there is a conflict, ask in the #appearance channel in Slack, or raise an issue in this github channel, but please be specific about what themes and snippets you are using, and what exactly doesn't look right.



## Acknowledgements

- [My Snippets](https://github.com/chetachiezikeuzor/MySnippets-Plugin) -- Chetachi's plugin is an excellent source (and a complement to this)
- [Fantasy Calendar](https://github.com/valentine195/obsidian-fantasy-calendar) as a plugin with complicated modal settings
- [Style Settings](https://github.com/mgmeyers/obsidian-style-settings/) for the color picker and dynamic style setting
