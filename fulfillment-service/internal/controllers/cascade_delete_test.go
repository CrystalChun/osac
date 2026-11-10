/*
Copyright (c) 2026 Red Hat Inc.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

  http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an
"AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific
language governing permissions and limitations under the License.
*/

package controllers

import (
	"context"
	"errors"
	"fmt"
	"testing"

	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

type cascadeTestItem struct {
	id       string
	deleting bool
}

func TestCascadeDeleteDeletesAcrossPagesAndSignalsPendingChildren(t *testing.T) {
	ctx := context.Background()
	items := []cascadeTestItem{{id: "one"}, {id: "two", deleting: true}, {id: "three"}}
	var deleted, signaled []string
	listCalls := 0
	pending, err := CascadeDelete(ctx, CascadeDeleteOptions[cascadeTestItem]{
		Resource: "child",
		PageSize: 2,
		List: func(_ context.Context, offset, limit int32) (*CascadePage[cascadeTestItem], error) {
			listCalls++
			if limit != 2 {
				t.Fatalf("list limit = %d, want 2", limit)
			}
			start := int(offset)
			end := start + int(limit)
			if end > len(items) {
				end = len(items)
			}
			pageItems := append([]cascadeTestItem(nil), items[start:end]...)
			return &CascadePage[cascadeTestItem]{Items: pageItems, Size: int32(len(pageItems)), Total: int32(len(items))}, nil
		},
		ID:         func(item cascadeTestItem) string { return item.id },
		IsDeleting: func(item cascadeTestItem) bool { return item.deleting },
		Delete: func(_ context.Context, id string) error {
			deleted = append(deleted, id)
			return nil
		},
		Signal: func(_ context.Context, id string) error {
			signaled = append(signaled, id)
			return nil
		},
	})
	if err != nil {
		t.Fatalf("CascadeDelete() error = %v", err)
	}
	if !pending {
		t.Fatal("CascadeDelete() pending = false, want true")
	}
	if listCalls != 2 {
		t.Fatalf("list calls = %d, want 2", listCalls)
	}
	if fmt.Sprint(deleted) != "[one three]" {
		t.Fatalf("deleted = %v, want [one three]", deleted)
	}
	if fmt.Sprint(signaled) != "[two]" {
		t.Fatalf("signaled = %v, want [two]", signaled)
	}
}

func TestCascadeDeleteIgnoresNotFound(t *testing.T) {
	pending, err := CascadeDelete(context.Background(), CascadeDeleteOptions[string]{
		Resource: "child",
		List: func(context.Context, int32, int32) (*CascadePage[string], error) {
			return &CascadePage[string]{Items: []string{"gone"}, Size: 1, Total: 1}, nil
		},
		ID:     func(item string) string { return item },
		Delete: func(context.Context, string) error { return status.Error(codes.NotFound, "already gone") },
	})
	if err != nil {
		t.Fatalf("CascadeDelete() error = %v", err)
	}
	if pending {
		t.Fatal("CascadeDelete() pending = true, want false after NotFound")
	}
}

func TestCascadeDeleteAggregatesErrorsAndKeepsPending(t *testing.T) {
	wantErr := errors.New("delete failed")
	pending, err := CascadeDelete(context.Background(), CascadeDeleteOptions[string]{
		Resource: "child",
		List: func(context.Context, int32, int32) (*CascadePage[string], error) {
			return &CascadePage[string]{Items: []string{"one", "two"}, Size: 2, Total: 2}, nil
		},
		ID: func(item string) string { return item },
		Delete: func(_ context.Context, id string) error {
			if id == "one" {
				return wantErr
			}
			return nil
		},
	})
	if !pending {
		t.Fatal("CascadeDelete() pending = false, want true")
	}
	if !errors.Is(err, wantErr) {
		t.Fatalf("CascadeDelete() error = %v, want wrapped delete error", err)
	}
}
