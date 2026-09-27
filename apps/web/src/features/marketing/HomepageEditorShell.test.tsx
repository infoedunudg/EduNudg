import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import type { ReactElement } from "react";
import {
  EditorAccordion,
  EditorFieldsGrid,
  EditorItemList,
  EditorItemPanel,
  EditorStaticSection,
  HomepageEditorPanel,
  HomepageEditorPanels,
  HomepageEditorSections,
  HomepageEditorShell,
} from "./HomepageEditorShell";
import { Input } from "@edunudg/ui";

describe("HomepageEditorShell", () => {
  it("regression_editor_page_header_and_sticky_save_bar", () => {
    const onSave = vi.fn();
    const { container } = render(
      <HomepageEditorShell
        title="Homepage Configuration"
        subtitle="Manage your public brand recruitment site."
        lastSavedLabel="Last saved: 2 hours ago"
        onSave={onSave}
        isDirty
      >
        <p>Form</p>
      </HomepageEditorShell>
    );

    expect(screen.getByRole("heading", { name: "Homepage Configuration" })).toBeDefined();
    expect(screen.getByText("Last saved: 2 hours ago")).toBeDefined();
    expect(container.querySelector(".ed-editor-page-header")).toBeTruthy();
    expect(container.querySelector(".ed-homepage-editor-shell--has-save")).toBeTruthy();
    expect(container.querySelector(".ed-editor-save-bar")).toBeTruthy();
    expect(screen.getByText("You have unsaved changes.")).toBeDefined();
    fireEvent.click(screen.getByRole("button", { name: /Save changes/i }));
    expect(onSave).toHaveBeenCalled();
  });

  it("regression_homepage_save_bar_status_avoids_draft_wording", () => {
    const { rerender } = render(
      <HomepageEditorShell title="Homepage Configuration" onSave={vi.fn()} isDirty>
        <p>Form</p>
      </HomepageEditorShell>
    );
    expect(screen.getByText("You have unsaved changes.")).toBeDefined();
    expect(screen.queryByText(/currently in draft/i)).toBeNull();

    rerender(
      <HomepageEditorShell title="Homepage Configuration" onSave={vi.fn()} saved>
        <p>Form</p>
      </HomepageEditorShell>
    );
    expect(screen.getByText("Saved.")).toBeDefined();
    expect(screen.getByText("Saved.").className).toContain("ed-editor-save-bar__status--ok");

    rerender(
      <HomepageEditorShell title="Homepage Configuration" onSave={vi.fn()}>
        <p>Form</p>
      </HomepageEditorShell>
    );
    expect(screen.getByText("No unsaved changes.")).toBeDefined();
  });

  it("regression_homepage_save_stays_enabled_when_clean", () => {
    const onSave = vi.fn();
    render(
      <HomepageEditorShell title="Homepage Configuration" onSave={onSave}>
        <p>Form</p>
      </HomepageEditorShell>
    );

    const save = screen.getByRole("button", { name: /Save changes/i });
    expect((save as HTMLButtonElement).disabled).toBe(false);
    fireEvent.click(save);
    expect(onSave).toHaveBeenCalled();
  });

  it("regression_panel_inline_save_bar", () => {
    const onSave = vi.fn();
    render(
      <HomepageEditorShell title="Homepage Configuration">
        <HomepageEditorPanel
          panelId="brand"
          title="Brand site"
          description="Franchise recruitment"
          onSave={onSave}
          isDirty
        >
          <p>Editor fields</p>
        </HomepageEditorPanel>
      </HomepageEditorShell>
    );
    expect(screen.getByRole("heading", { name: "Brand site" })).toBeDefined();
    expect(document.querySelector(".ed-editor-save-bar--inline")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /Save changes/i }));
    expect(onSave).toHaveBeenCalled();
  });

  it("regression_page_panels_are_single_open_accordions", () => {
    render(
      <HomepageEditorPanels defaultOpenId="brand">
        <HomepageEditorPanel panelId="brand" title="Brand site" onSave={vi.fn()}>
          <p>Brand fields</p>
        </HomepageEditorPanel>
        <HomepageEditorPanel panelId="center" title="Center sites" onSave={vi.fn()}>
          <p>Center fields</p>
        </HomepageEditorPanel>
      </HomepageEditorPanels>
    );

    expect(screen.getByText("Brand fields")).toBeDefined();
    expect(screen.queryByText("Center fields")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: /Center sites/i }));
    expect(screen.queryByText("Brand fields")).toBeNull();
    expect(screen.getByText("Center fields")).toBeDefined();
  });
});

describe("EditorStaticSection", () => {
  it("regression_renders_always_visible_section_card", () => {
    const { container } = render(
      <EditorStaticSection sectionId="site" title="Site Identity">
        <p>Site fields</p>
      </EditorStaticSection>
    );
    expect(screen.getByRole("heading", { name: "Site Identity" })).toBeDefined();
    expect(screen.getByText("Site fields")).toBeDefined();
    expect(container.querySelector(".ed-editor-section-card")).toBeTruthy();
  });
});

describe("EditorAccordion", () => {
  function renderAccordion(ui: ReactElement) {
    return render(<HomepageEditorSections>{ui}</HomepageEditorSections>);
  }

  it("regression_collapsed_by_default", () => {
    const { container } = renderAccordion(
      <EditorAccordion sectionId="hero" title="Hero">
        <p>Form fields</p>
      </EditorAccordion>
    );
    expect(container.querySelector(".ed-editor-accordion--open")).toBeNull();
    expect(screen.getByRole("button", { name: /Hero/i })).toBeDefined();
  });

  it("regression_single_open_accordion", () => {
    renderAccordion(
      <>
        <EditorAccordion sectionId="hero" title="Hero">
          <p>Hero fields</p>
        </EditorAccordion>
        <EditorAccordion sectionId="faq" title="FAQ">
          <p>FAQ fields</p>
        </EditorAccordion>
      </>
    );

    fireEvent.click(screen.getByRole("button", { name: /Hero/i }));
    expect(screen.getByText("Hero fields")).toBeDefined();

    fireEvent.click(screen.getByRole("button", { name: /FAQ/i }));
    expect(screen.queryByText("Hero fields")).toBeNull();
    expect(screen.getByText("FAQ fields")).toBeDefined();
  });

  it("regression_scrolls_opened_accordion_into_view", async () => {
    const scrollIntoView = vi.fn();
    Element.prototype.scrollIntoView = scrollIntoView;

    renderAccordion(
      <>
        <EditorAccordion sectionId="hero" title="Hero">
          <p>Hero fields</p>
        </EditorAccordion>
        <EditorAccordion sectionId="faq" title="FAQ">
          <p>FAQ fields</p>
        </EditorAccordion>
      </>
    );

    fireEvent.click(screen.getByRole("button", { name: /FAQ/i }));

    await vi.waitFor(() => {
      expect(scrollIntoView).toHaveBeenCalledWith({ behavior: "smooth", block: "start" });
    });
  });

  it("regression_shows_icon_subtitle_and_visibility_when_open", () => {
    const { container } = renderAccordion(
      <EditorAccordion sectionId="faq" title="FAQ" enabled onEnabledChange={() => undefined}>
        <p>Form fields</p>
      </EditorAccordion>
    );

    expect(screen.getByText("Common questions and answers")).toBeDefined();
    fireEvent.click(screen.getByRole("button", { name: /FAQ/i }));
    expect(screen.getByText("Visible on site")).toBeDefined();
    expect(container.querySelector(".ed-editor-accordion--open")).toBeTruthy();
  });
});

describe("Homepage editor layout helpers", () => {
  it("regression_editor_fields_grid_and_item_panel_render_shared_classes", () => {
    const { container } = render(
      <EditorItemList onAdd={vi.fn()} addLabel="+ Add item">
        <EditorItemPanel title="Item 1" onRemove={vi.fn()} removeLabel="Remove item">
          <EditorFieldsGrid>
            <Input label="Field A" value="" onChange={() => undefined} />
            <Input label="Field B" value="" onChange={() => undefined} />
          </EditorFieldsGrid>
        </EditorItemPanel>
      </EditorItemList>
    );

    expect(container.querySelector(".ed-editable-form .ed-form-grid")).toBeTruthy();
    expect(container.querySelector(".ed-editor-item-panel")).toBeTruthy();
    expect(container.querySelector(".ed-editor-item-list__add .ed-btn--primary")).toBeTruthy();
    expect(container.querySelector(".ed-editor-item-panel__remove .ed-btn--danger")).toBeTruthy();
    expect(screen.getByRole("button", { name: "+ Add item" })).toBeDefined();
  });

  it("regression_nav_row_variant", () => {
    const { container } = render(
      <EditorItemPanel title="Menu item 1" variant="nav" onRemove={vi.fn()} removeLabel="Remove menu item">
        <Input label="Label" value="FAQ" onChange={() => undefined} />
        <Input label="Link" value="#faq" onChange={() => undefined} />
      </EditorItemPanel>
    );
    expect(container.querySelector(".ed-editor-nav-row")).toBeTruthy();
  });
});
