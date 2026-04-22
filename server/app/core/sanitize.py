"""HTML input sanitization utilities.

``sanitize_html`` retains safe formatting markup produced by WYSIWYG editors
while stripping any tag or attribute that could execute script or load external
resources (XSS prevention).  The allowed set covers the intersection of common
rich-text outputs (headings, lists, links, images, code blocks) with tags that
carry no script-execution risk when their attributes are also constrained.

``strip_html`` removes all markup entirely and returns plain text.  Use it for
fields that accept user-supplied text but must never render as HTML.
"""

import nh3

_ALLOWED_TAGS: set[str] = {
    "a",
    "b",
    "blockquote",
    "br",
    "caption",
    "code",
    "del",
    "em",
    "h1",
    "h2",
    "h3",
    "h4",
    "h5",
    "h6",
    "hr",
    "i",
    "img",
    "li",
    "ol",
    "p",
    "pre",
    "s",
    "strong",
    "sub",
    "sup",
    "table",
    "tbody",
    "td",
    "th",
    "thead",
    "tr",
    "u",
    "ul",
}

_ALLOWED_ATTRIBUTES: dict[str, set[str]] = {
    "a": {"href", "title", "target"},
    "img": {"src", "alt", "title", "width", "height"},
    "td": {"colspan", "rowspan"},
    "th": {"colspan", "rowspan", "scope"},
    "*": {"class"},
}


def sanitize_html(value: str) -> str:
    """Strip unsafe tags and attributes from HTML while preserving safe markup."""
    return nh3.clean(
        value,
        tags=_ALLOWED_TAGS,
        attributes=_ALLOWED_ATTRIBUTES,
        link_rel="noopener noreferrer",
    )


def strip_html(value: str) -> str:
    """Remove all HTML markup and return plain text."""
    return nh3.clean(value, tags=set(), attributes={})
